package com.elanjaibuildos.backend.identity.repository;

import com.elanjaibuildos.backend.identity.domain.PasswordReset;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PasswordResetRepository extends JpaRepository<PasswordReset, UUID> {
    Optional<PasswordReset> findByToken(String token);
}
