package com.elanjaibuildos.backend.materials.service;

import com.elanjaibuildos.backend.materials.api.MaterialSpentRequest;
import com.elanjaibuildos.backend.materials.api.MaterialSpentResponse;
import com.elanjaibuildos.backend.materials.domain.MaterialSpent;
import com.elanjaibuildos.backend.sites.domain.Site;
import com.elanjaibuildos.backend.identity.domain.User;
import com.elanjaibuildos.backend.materials.repository.MaterialSpentRepository;
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
public class MaterialSpentService {

    private final MaterialSpentRepository materialSpentRepository;
    private final SiteRepository siteRepository;
    private final UserRepository userRepository;

    public List<MaterialSpentResponse> getAllMaterialSpent() {
        return materialSpentRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // TODO: Filter by site ID?

    public MaterialSpentResponse createOrUpdateMaterialSpent(MaterialSpentRequest request) {
        User currentUser = getCurrentUser();
        Site site = siteRepository.findById(request.getSiteId())
                .orElseThrow(() -> new RuntimeException("Site not found"));

        MaterialSpent materialSpent = materialSpentRepository
                .findBySiteIdAndMaterialType(request.getSiteId(), request.getMaterialType())
                .orElse(MaterialSpent.builder()
                        .site(site)
                        .materialType(request.getMaterialType())
                        .build());

        materialSpent.setQuantity(request.getQuantity());
        materialSpent.setUnit(request.getUnit());
        materialSpent.setUpdatedBy(currentUser);

        return mapToResponse(materialSpentRepository.save(materialSpent));
    }

    public void deleteMaterialSpent(UUID id) {
        materialSpentRepository.deleteById(id);
    }

    private User getCurrentUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) throw new RuntimeException("User not found in context");
        return userRepository.findByEmail(auth.getName()).orElseThrow();
    }

    private MaterialSpentResponse mapToResponse(MaterialSpent materialSpent) {
        return MaterialSpentResponse.builder()
                .id(materialSpent.getId())
                .siteId(materialSpent.getSite().getId())
                .materialType(materialSpent.getMaterialType())
                .quantity(materialSpent.getQuantity())
                .unit(materialSpent.getUnit())
                .updatedBy(materialSpent.getUpdatedBy() != null ? materialSpent.getUpdatedBy().getId() : null)
                .updatedAt(materialSpent.getUpdatedAt())
                .build();
    }
}
