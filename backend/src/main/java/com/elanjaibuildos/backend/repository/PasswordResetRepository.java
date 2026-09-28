package com.elanjaibuildos.backend.repository;

import com.elanjaibuildos.backend.model.PasswordReset;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PasswordResetRepository extends JpaRepository<PasswordReset, UUID> {
    Optional<PasswordReset> findByToken(String token);
}
