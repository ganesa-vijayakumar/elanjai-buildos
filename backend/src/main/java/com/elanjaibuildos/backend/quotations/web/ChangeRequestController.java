package com.elanjaibuildos.backend.quotations.web;

import com.elanjaibuildos.backend.quotations.domain.ChangeRequest;
import com.elanjaibuildos.backend.identity.domain.Role;
import com.elanjaibuildos.backend.sites.domain.Site;
import com.elanjaibuildos.backend.identity.domain.User;
import com.elanjaibuildos.backend.quotations.repository.ChangeRequestRepository;
import com.elanjaibuildos.backend.sites.repository.SiteRepository;
import com.elanjaibuildos.backend.identity.repository.UserRepository;
import com.elanjaibuildos.backend.notifications.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import com.elanjaibuildos.backend.sites.service.SiteAccessGuard;

/** Change requests (F-051): client raises, owner/admin approves — or owner raises for client. */
@RestController
@RequiredArgsConstructor
public class ChangeRequestController {

    private final ChangeRequestRepository crs;
    private final SiteRepository sites;
    private final UserRepository users;
    private final NotificationService notifications;
    private final com.elanjaibuildos.backend.sites.service.SiteAccessGuard guard;

    @GetMapping("/api/sites/{siteId}/change-requests")
    public List<ChangeRequest> list(@PathVariable UUID siteId,
                                    @RequestParam(required = false) String status) {
        guard.assertReadable(siteId);
        return status != null
                ? crs.findBySiteIdAndStatus(siteId, status)
                : crs.findBySiteIdOrderByCreatedAtDesc(siteId);
    }

    public record CrBody(String description, String type, String category,
                         BigDecimal costImpact, String timelineImpact, UUID referenceImageId) {}

    @PostMapping("/api/sites/{siteId}/change-requests")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','SITE_MANAGER','CLIENT')")
    public ResponseEntity<?> create(@PathVariable UUID siteId, @RequestBody CrBody b) {
        Site site = guard.assertReadable(siteId);
        User me = currentUser();
        ChangeRequest cr = ChangeRequest.builder()
                .crNumber("CR-" + System.currentTimeMillis() % 100000)
                .site(site).description(b.description()).type(b.type()).category(b.category())
                .costImpact(b.costImpact()).timelineImpact(b.timelineImpact())
                .referenceImageId(b.referenceImageId())
                .requestedBy(me.getRole() == Role.CLIENT ? "client" : "builder")
                .createdBy(me).status("pending")
                .build();
        ChangeRequest saved = crs.save(cr);
        notifyApprovers(me, saved);
        return ResponseEntity.ok(saved);
    }

    public record DecisionBody(String status, String approverNotes) {}

    /** Approve/reject/implement — owner/admin only. */
    @PostMapping("/api/change-requests/{id}/decision")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<?> decide(@PathVariable UUID id, @RequestBody DecisionBody b) {
        ChangeRequest cr = crs.findById(id).orElseThrow();
        if (!List.of("approved", "rejected", "implemented").contains(b.status()))
            return ResponseEntity.badRequest().body(Map.of("error", "BAD_STATUS"));
        cr.setStatus(b.status());
        cr.setApproverNotes(b.approverNotes());
        cr.setUpdatedAt(Instant.now());
        ChangeRequest saved = crs.save(cr);
        if (cr.getCreatedBy() != null) {
            try {
                notifications.toUser(cr.getCreatedBy().getId(), "change_request_" + b.status(),
                        "Change request " + b.status(),
                        cr.getCrNumber() + " " + b.status() +
                                (b.approverNotes() != null ? ": " + b.approverNotes() : "."), null);
            } catch (Exception ignored) { }
        }
        return ResponseEntity.ok(saved);
    }

    private void notifyApprovers(User submitter, ChangeRequest cr) {
        try {
            for (Role r : new Role[]{Role.OWNER, Role.ADMIN}) {
                for (User u : users.findByRole(r)) {
                    if (u.getId().equals(submitter.getId())) continue;
                    notifications.toUser(u.getId(), "change_request_pending",
                            "New change request " + cr.getCrNumber(),
                            submitter.getFullName() + " requested: " +
                                    (cr.getDescription().length() > 80
                                            ? cr.getDescription().substring(0, 80) + "…"
                                            : cr.getDescription()), null);
                }
            }
        } catch (Exception ignored) { }
    }

    private User currentUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) throw new RuntimeException("User not found in context");
        return users.findByEmail(auth.getName()).orElseThrow();
    }
}
