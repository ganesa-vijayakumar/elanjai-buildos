package com.elanjaibuildos.backend.platform.repository;

import com.elanjaibuildos.backend.platform.domain.SignupRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SignupRequestRepository extends JpaRepository<SignupRequest, UUID> {
    Optional<SignupRequest> findByVerifyToken(String token);
    List<SignupRequest> findByStatus(SignupRequest.Status status);
    boolean existsBySlugAndStatus(String slug, SignupRequest.Status status);
    boolean existsByEmailAndStatus(String email, SignupRequest.Status status);
    Optional<SignupRequest> findTopBySlugOrderByCreatedAtDesc(String slug);
}
