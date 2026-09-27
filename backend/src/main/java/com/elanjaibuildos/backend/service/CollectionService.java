package com.elanjaibuildos.backend.service;

import com.elanjaibuildos.backend.dto.CollectionRequest;
import com.elanjaibuildos.backend.dto.CollectionResponse;
import com.elanjaibuildos.backend.model.Collection;
import com.elanjaibuildos.backend.model.Site;
import com.elanjaibuildos.backend.model.User;
import com.elanjaibuildos.backend.repository.CollectionRepository;
import com.elanjaibuildos.backend.repository.SiteRepository;
import com.elanjaibuildos.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CollectionService {

    private final CollectionRepository collectionRepository;
    private final SiteRepository siteRepository;
    private final UserRepository userRepository;

    public List<CollectionResponse> getAllCollections() {
        return collectionRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<CollectionResponse> getCollectionsBySiteId(UUID siteId) {
        return collectionRepository.findBySiteId(siteId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // TODO: Filter by user permissions

    public CollectionResponse createCollection(CollectionRequest request) {
        User currentUser = getCurrentUser();
        Site site = siteRepository.findById(request.getSiteId())
                .orElseThrow(() -> new RuntimeException("Site not found"));

        Collection collection = Collection.builder()
                .site(site)
                .amount(request.getAmount())
                .stage(request.getStage())
                .paymentMode(request.getPaymentMode())
                .referenceNumber(request.getReferenceNumber())
                .notes(request.getNotes())
                .receivedDate(request.getReceivedDate())
                .createdBy(currentUser)
                .build();

        return mapToResponse(collectionRepository.save(collection));
    }

    public CollectionResponse updateCollection(UUID id, CollectionRequest request) {
        Collection collection = collectionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Collection not found"));

        collection.setAmount(request.getAmount());
        collection.setStage(request.getStage());
        collection.setPaymentMode(request.getPaymentMode());
        collection.setReferenceNumber(request.getReferenceNumber());
        collection.setNotes(request.getNotes());
        collection.setReceivedDate(request.getReceivedDate());

        return mapToResponse(collectionRepository.save(collection));
    }

    public void deleteCollection(UUID id) {
        collectionRepository.deleteById(id);
    }

    private User getCurrentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserDetails) {
            String email = ((UserDetails) principal).getUsername();
            return userRepository.findByEmail(email).orElseThrow();
        }
        throw new RuntimeException("User not found in context");
    }

    private CollectionResponse mapToResponse(Collection collection) {
        return CollectionResponse.builder()
                .id(collection.getId())
                .siteId(collection.getSite().getId())
                .siteName(collection.getSite().getSiteName())
                .amount(collection.getAmount())
                .stage(collection.getStage())
                .paymentMode(collection.getPaymentMode())
                .referenceNumber(collection.getReferenceNumber())
                .notes(collection.getNotes())
                .receivedDate(collection.getReceivedDate())
                .createdBy(collection.getCreatedBy() != null ? collection.getCreatedBy().getId() : null)
                .createdAt(collection.getCreatedAt())
                .build();
    }
}
