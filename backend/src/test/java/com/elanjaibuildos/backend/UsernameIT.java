package com.elanjaibuildos.backend;

import com.elanjaibuildos.backend.common.multitenancy.TenantContext;
import com.elanjaibuildos.backend.identity.api.RegisterRequest;
import com.elanjaibuildos.backend.identity.domain.Role;
import com.elanjaibuildos.backend.identity.domain.User;
import com.elanjaibuildos.backend.identity.service.UserService;
import com.elanjaibuildos.backend.identity.service.UsernameService;
import com.elanjaibuildos.backend.platform.service.UsernameBackfillService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Canonical <local>@<slug> username identity (02-tenancy/01 Phase B):
 * assignment at creation, identifier sign-in precedence, suffix rejection,
 * write-time disjointness, and the per-tenant backfill job.
 */
class UsernameIT extends TenancyITSupport {

    private static final String ALPHA = "it-alpha";
    private static final String ALPHA_SCHEMA = "t_it-alpha";
    private static final String ALPHA_EMAIL = "owner@it-alpha.test";

    @Autowired private UserService userService;
    @Autowired private UsernameService usernames;
    @Autowired private UsernameBackfillService backfill;
    @Autowired private PasswordEncoder encoder;

    @Test
    void ownerGetsCanonicalUsernameAndSignsInThreeWays() throws Exception {
        provisionTenant(ALPHA, ALPHA_EMAIL);

        TenantContext.setTenant(ALPHA, ALPHA_SCHEMA, "TRIAL");
        User owner = users.findByEmail(ALPHA_EMAIL).orElseThrow();
        assertEquals("owner@it-alpha", owner.getUsername());   // canonical at creation
        TenantContext.clear();

        assertNotNull(login(ALPHA, ALPHA_EMAIL));              // email (legacy path)
        assertNotNull(login(ALPHA, "owner@it-alpha"));         // canonical username
        assertNotNull(login(ALPHA, "owner"));                  // bare local-part
    }

    @Test
    void usernameWithWrongSuffixIsRejectedBeforeLookup() throws Exception {
        provisionTenant(ALPHA, ALPHA_EMAIL);

        // canonical-username shape whose slug ≠ resolved tenant → 401, no fallback
        mvc.perform(post("/api/auth/login")
                        .header("Host", ALPHA + ".localhost")
                        .contentType("application/json")
                        .content("{\"identifier\":\"owner@it-beta\",\"password\":\"" + OWNER_PASSWORD + "\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void slugShapedEmailStillAuthenticatesAsEmail() throws Exception {
        provisionTenant(ALPHA, ALPHA_EMAIL);

        // legacy user whose EMAIL itself is username-shaped — the email branch
        // wins first, so it must authenticate (never treated as a username)
        TenantContext.setTenant(ALPHA, ALPHA_SCHEMA, "TRIAL");
        User legacy = new User();
        legacy.setEmail("legacy@it-alpha");
        legacy.setFullName("Legacy User");
        legacy.setPassword(encoder.encode(OWNER_PASSWORD));
        legacy.setRole(Role.CLIENT);
        legacy.setStatus("active");
        users.save(legacy);
        TenantContext.clear();

        assertNotNull(login(ALPHA, "legacy@it-alpha"));
    }

    @Test
    void disjointnessEnforcedBothDirections() {
        provisionTenant(ALPHA, ALPHA_EMAIL);
        TenantContext.setTenant(ALPHA, ALPHA_SCHEMA, "TRIAL");
        try {
            // direction 1: an email equal to an existing username is rejected
            RegisterRequest req = new RegisterRequest();
            req.setFullName("Clash");
            req.setEmail("owner@it-alpha");              // == owner's canonical username
            req.setPassword("Whatever123!");
            req.setRole(Role.CLIENT);
            assertThrows(IllegalArgumentException.class, () -> userService.createUser(req));

            // direction 2: a username equal to an existing email is rejected
            insertLegacy("selfref@it-alpha");            // stored slug-shaped email
            User target = new User();
            target.setId(java.util.UUID.randomUUID());
            assertThrows(IllegalArgumentException.class,
                    () -> usernames.assignExplicit(target, "selfref@it-alpha", ALPHA));

            // a username whose suffix ≠ this workspace is rejected
            assertThrows(IllegalArgumentException.class,
                    () -> usernames.assignExplicit(target, "name@other-ws", ALPHA));

            // self-collision: assigning a user's own email-shaped candidate is refused
            User selfref = users.findByEmail("selfref@it-alpha").orElseThrow();
            assertNull(usernames.assignDerived(selfref, ALPHA));   // == own email → skipped
        } finally {
            TenantContext.clear();
        }
    }

    @Test
    void backfillAssignsDeterministicallySkipsCollisionsAndIsIdempotent() {
        provisionTenant(ALPHA, ALPHA_EMAIL);

        TenantContext.setTenant(ALPHA, ALPHA_SCHEMA, "TRIAL");
        insertLegacy("same@a.test");           // collides with the next row on same@it-alpha
        insertLegacy("same@b.test");
        insertLegacy("selfref@it-alpha");      // derived candidate == own email → flagged
        TenantContext.clear();

        var report = backfill.backfillTenant(ALPHA);
        assertEquals(3, report.scanned());
        assertEquals(1, report.assigned());    // exactly one of the same@* pair wins
        assertEquals(2, report.flagged());     // collision loser + the self-collision

        TenantContext.setTenant(ALPHA, ALPHA_SCHEMA, "TRIAL");
        assertEquals(1, users.findAll().stream()
                .filter(u -> "same@it-alpha".equals(u.getUsername())).count());
        assertNull(users.findByEmail("selfref@it-alpha").orElseThrow().getUsername());
        // the pre-existing canonical username was never overwritten
        assertEquals("owner@it-alpha",
                users.findByEmail(ALPHA_EMAIL).orElseThrow().getUsername());
        TenantContext.clear();

        // re-run is a no-op: flagged rows stay NULL (rescanned) but nothing is assigned
        var again = backfill.backfillTenant(ALPHA);
        assertEquals(2, again.scanned());
        assertEquals(0, again.assigned());
        assertEquals(2, again.flagged());
    }

    private void insertLegacy(String email) {
        User u = new User();
        u.setEmail(email);
        u.setFullName("Legacy " + email);
        u.setPassword("x");
        u.setRole(Role.CLIENT);
        u.setStatus("active");
        users.save(u);
    }

    private String login(String slug, String identifier) throws Exception {
        var result = mvc.perform(post("/api/auth/login")
                        .header("Host", slug + ".localhost")
                        .contentType("application/json")
                        .content("{\"identifier\":\"" + identifier + "\",\"password\":\""
                                + OWNER_PASSWORD + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        String body = result.getResponse().getContentAsString();
        String marker = "\"token\":\"";
        int i = body.indexOf(marker);
        return i < 0 ? null : body.substring(i + marker.length(), body.indexOf('"', i + marker.length()));
    }
}
