package com.elanjaibuildos.backend.billing.service;

import com.elanjaibuildos.backend.billing.api.CollectionRequest;
import com.elanjaibuildos.backend.billing.api.CollectionResponse;
import com.elanjaibuildos.backend.billing.domain.Collection;
import com.elanjaibuildos.backend.sites.domain.Site;
import com.elanjaibuildos.backend.identity.domain.User;
import com.elanjaibuildos.backend.billing.repository.CollectionRepository;
import com.elanjaibuildos.backend.sites.repository.SiteRepository;
import com.elanjaibuildos.backend.sites.repository.SiteStageRepository;
import com.elanjaibuildos.backend.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import com.elanjaibuildos.backend.notifications.service.NotificationService;
import com.elanjaibuildos.backend.sites.service.SiteAccessGuard;
import com.elanjaibuildos.backend.sites.domain.ExpenseApprovalStatus;
import com.elanjaibuildos.backend.identity.domain.Role;

@Service
@RequiredArgsConstructor
public class CollectionService {

    private final CollectionRepository collectionRepository;
    private final SiteRepository siteRepository;
    private final SiteStageRepository siteStageRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final SiteAccessGuard siteAccessGuard;

    public List<CollectionResponse> getAllCollections() {
        User me = getCurrentUser();
        return collectionRepository.findAll().stream()
                .filter(c -> me.getRole() != com.elanjaibuildos.backend.identity.domain.Role.CLIENT
                        || (c.getSite().getClientUser() != null
                                && c.getSite().getClientUser().getId().equals(me.getId())))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<CollectionResponse> getCollectionsBySiteId(UUID siteId) {
        siteAccessGuard.assertReadable(siteId);
        return collectionRepository.findBySiteId(siteId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public CollectionResponse createCollection(CollectionRequest request) {
        User currentUser = getCurrentUser();
        Site site = siteRepository.findById(request.getSiteId())
                .orElseThrow(() -> new RuntimeException("Site not found"));

        // Collections entered by site managers start PENDING owner/admin approval
        boolean needsApproval = currentUser.getRole() == com.elanjaibuildos.backend.identity.domain.Role.SITE_MANAGER;

        String stageLabel = resolveStageLabel(request);

        Collection collection = Collection.builder()
                .site(site)
                .amount(request.getAmount())
                .stageId(request.getStageId())
                .stage(stageLabel)
                .paymentMode(request.getPaymentMode())
                .referenceNumber(request.getReferenceNumber())
                .notes(request.getNotes())
                .receivedDate(request.getReceivedDate() != null
                        ? request.getReceivedDate()
                        : java.time.LocalDate.now())
                .createdBy(currentUser)
                .approvalStatus(needsApproval
                        ? com.elanjaibuildos.backend.sites.domain.ExpenseApprovalStatus.PENDING
                        : com.elanjaibuildos.backend.sites.domain.ExpenseApprovalStatus.APPROVED)
                .approvedBy(needsApproval ? null : currentUser)
                .approvedAt(needsApproval ? null : java.time.LocalDateTime.now())
                .build();

        Collection saved = collectionRepository.save(collection);
        if (needsApproval) notifyApprovers("collection", currentUser, saved.getAmount(), site);
        return mapToResponse(saved);
    }

    public CollectionResponse updateCollection(UUID id, CollectionRequest request) {
        Collection collection = collectionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Collection not found"));

        collection.setAmount(request.getAmount());
        collection.setStageId(request.getStageId());
        collection.setStage(resolveStageLabel(request));
        collection.setPaymentMode(request.getPaymentMode());
        collection.setReferenceNumber(request.getReferenceNumber());
        collection.setNotes(request.getNotes());
        collection.setReceivedDate(request.getReceivedDate());

        return mapToResponse(collectionRepository.save(collection));
    }

    public void deleteCollection(UUID id) {
        collectionRepository.deleteById(id);
    }

    /** Denormalize the stage label — prefer explicit name, else resolve from site_stages by id. */
    private String resolveStageLabel(CollectionRequest request) {
        if (request.getStage() != null && !request.getStage().isBlank()) return request.getStage();
        if (request.getStageId() != null) {
            return siteStageRepository.findById(request.getStageId())
                    .map(s -> s.getName()).orElse(null);
        }
        return null;
    }

    /** Alert owner/admins that a staff entry needs sign-off. */
    private void notifyApprovers(String kind, User submitter, java.math.BigDecimal amount, Site site) {
        try {
            for (com.elanjaibuildos.backend.identity.domain.Role r :
                    new com.elanjaibuildos.backend.identity.domain.Role[]{com.elanjaibuildos.backend.identity.domain.Role.OWNER,
                            com.elanjaibuildos.backend.identity.domain.Role.ADMIN}) {
                for (User u : userRepository.findByRole(r)) {
                    if (u.getId().equals(submitter.getId())) continue;
                    notificationService.toUser(u.getId(), kind + "_pending",
                            "New " + kind + " pending approval",
                            submitter.getFullName() + " submitted " + kind + " of " + amount +
                                    (site != null ? " for " + site.getSiteName() : "") + ".", null);
                }
            }
        } catch (Exception ignored) { }
    }

    private User getCurrentUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) throw new RuntimeException("User not found in context");
        return userRepository.findByEmail(auth.getName()).orElseThrow();
    }

    private CollectionResponse mapToResponse(Collection collection) {
        return CollectionResponse.builder()
                .id(collection.getId())
                .siteId(collection.getSite().getId())
                .siteName(collection.getSite().getSiteName())
                .amount(collection.getAmount())
                .stageId(collection.getStageId())
                .stage(collection.getStage())
                .paymentMode(collection.getPaymentMode())
                .referenceNumber(collection.getReferenceNumber())
                .notes(collection.getNotes())
                .receivedDate(collection.getReceivedDate())
                .approvalStatus(collection.getApprovalStatus())
                .createdBy(collection.getCreatedBy() != null ? collection.getCreatedBy().getId() : null)
                .createdAt(collection.getCreatedAt())
                .build();
    }
}
