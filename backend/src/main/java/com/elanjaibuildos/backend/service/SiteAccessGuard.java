package com.elanjaibuildos.backend.service;

import com.elanjaibuildos.backend.model.Role;
import com.elanjaibuildos.backend.model.Site;
import com.elanjaibuildos.backend.model.User;
import com.elanjaibuildos.backend.repository.SiteRepository;
import com.elanjaibuildos.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Client scoping for site-scoped resources. Staff roles (OWNER/ADMIN/SITE_MANAGER)
 * may access any site; a CLIENT may only access the site linked via
 * sites.client_user_id. Throws {@link AccessDeniedException} (403) otherwise.
 */
@Component
@RequiredArgsConstructor
public class SiteAccessGuard {

    private final SiteRepository sites;
    private final UserRepository users;

    /** Returns the site when readable; throws 404-style error when missing, 403 when not owned. */
    public Site assertReadable(UUID siteId) {
        Site site = sites.findById(siteId)
                .orElseThrow(() -> new RuntimeException("Site not found"));
        assertOwner(site);
        return site;
    }

    /** Same check when the site entity is already loaded. */
    public void assertOwner(Site site) {
        User me = currentUser();
        if (me.getRole() == Role.CLIENT
                && (site.getClientUser() == null
                        || !site.getClientUser().getId().equals(me.getId()))) {
            throw new AccessDeniedException("Clients can only access their own site");
        }
    }

    /** True when the current user is a CLIENT restricted to linked sites. */
    public boolean isClientScoped() {
        return currentUser().getRole() == Role.CLIENT;
    }

    public User currentUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null)
            throw new RuntimeException("User not found in context");
        return users.findByEmail(auth.getName()).orElseThrow();
    }
}
