package com.elanjaibuildos.backend.sites.service;

import com.elanjaibuildos.backend.sites.api.SiteRequest;
import com.elanjaibuildos.backend.sites.api.SiteResponse;
import com.elanjaibuildos.backend.sites.domain.Site;
import com.elanjaibuildos.backend.sites.domain.SiteStatus;
import com.elanjaibuildos.backend.identity.domain.User;
import com.elanjaibuildos.backend.platform.domain.UsageCounter;
import com.elanjaibuildos.backend.platform.service.PlatformGuard;
import com.elanjaibuildos.backend.sites.repository.SiteRepository;
import com.elanjaibuildos.backend.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SiteService {

    private final SiteRepository siteRepository;
    private final UserRepository userRepository;
    private final PlatformGuard platformGuard;
    private final StageService stageService;
    private final SiteAccessGuard siteAccessGuard;

    public List<SiteResponse> getAllSites() {
        return siteRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<SiteResponse> getMySites() {
        User currentUser = getCurrentUser();
        if (currentUser.getRole().name().equals("ADMIN")
                || currentUser.getRole().name().equals("OWNER")
                || currentUser.getRole().name().equals("SITE_MANAGER")) {
            return getAllSites();
        }
        // For Client, fetch only their sites
        return siteRepository.findByClientUserId(currentUser.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public SiteResponse getSiteById(UUID id) {
        return mapToResponse(siteAccessGuard.assertReadable(id));
    }

    public SiteResponse createSite(SiteRequest request) {
        platformGuard.checkAndIncrement(UsageCounter.M_PROJECTS);
        User currentUser = getCurrentUser();

        User clientUser = null;
        if (request.getClientUserId() != null) {
            clientUser = userRepository.findById(request.getClientUserId()).orElse(null);
        }

        Site site = Site.builder()
                .siteName(request.getSiteName())
                .clientName(request.getClientName())
                .clientPhone(request.getClientPhone())
                .clientEmail(request.getClientEmail())
                .clientUser(clientUser)
                .location(request.getLocation())
                .builtupArea(request.getBuiltupArea())
                .ratePerSqft(request.getRatePerSqft())
                .packageName(request.getPackageName())
                .totalValue(request.getTotalValue())
                .currentStage(request.getCurrentStage())
                .status(request.getStatus() != null ? request.getStatus() : SiteStatus.IN_PROGRESS)
                .startDate(request.getStartDate())
                .expectedEndDate(request.getExpectedEndDate())
                .estimatedMaterialExpense(request.getEstimatedMaterialExpense())
                .createdBy(currentUser)
                .build();

        Site saved = siteRepository.save(site);
        stageService.copyTemplateToSite(saved);
        if (saved.getCurrentStage() == null || saved.getCurrentStage().isBlank()) {
            stageService.forSite(saved.getId()).stream().findFirst()
                    .ifPresent(s -> { saved.setCurrentStage(s.getName()); siteRepository.save(saved); });
        }
        return mapToResponse(saved);
    }

    public SiteResponse updateSite(UUID id, SiteRequest request) {
        Site site = siteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Site not found"));

        site.setSiteName(request.getSiteName());
        site.setClientName(request.getClientName());
        site.setClientPhone(request.getClientPhone());
        site.setClientEmail(request.getClientEmail());
        site.setLocation(request.getLocation());
        site.setBuiltupArea(request.getBuiltupArea());
        site.setRatePerSqft(request.getRatePerSqft());
        site.setPackageName(request.getPackageName());
        site.setTotalValue(request.getTotalValue());
        site.setCurrentStage(request.getCurrentStage());
        site.setStatus(request.getStatus());
        site.setStartDate(request.getStartDate());
        site.setExpectedEndDate(request.getExpectedEndDate());
        site.setEstimatedMaterialExpense(request.getEstimatedMaterialExpense());

        if (request.getClientUserId() != null) {
            User clientUser = userRepository.findById(request.getClientUserId()).orElse(null);
            site.setClientUser(clientUser);
        }

        return mapToResponse(siteRepository.save(site));
    }

    public void deleteSite(UUID id) {
        siteRepository.deleteById(id);
    }

    private User getCurrentUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) throw new RuntimeException("User not found in context");
        return userRepository.findByEmail(auth.getName()).orElseThrow();
    }

    private SiteResponse mapToResponse(Site site) {
        return SiteResponse.builder()
                .id(site.getId())
                .siteName(site.getSiteName())
                .clientName(site.getClientName())
                .clientPhone(site.getClientPhone())
                .clientEmail(site.getClientEmail())
                .clientUserId(site.getClientUser() != null ? site.getClientUser().getId() : null)
                .location(site.getLocation())
                .builtupArea(site.getBuiltupArea())
                .ratePerSqft(site.getRatePerSqft())
                .packageName(site.getPackageName())
                .totalValue(site.getTotalValue())
                .currentStage(site.getCurrentStage())
                .status(site.getStatus())
                .startDate(site.getStartDate())
                .expectedEndDate(site.getExpectedEndDate())
                .estimatedMaterialExpense(site.getEstimatedMaterialExpense())
                .createdBy(site.getCreatedBy() != null ? site.getCreatedBy().getId() : null)
                .createdAt(site.getCreatedAt())
                .build();
    }
}
