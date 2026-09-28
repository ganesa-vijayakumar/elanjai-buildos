package com.elanjaibuildos.backend.repository;

import com.elanjaibuildos.backend.model.Invite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InviteRepository extends JpaRepository<Invite, UUID> {
    Optional<Invite> findByToken(String token);
    List<Invite> findByAcceptedAtIsNullOrderByCreatedAtDesc();
}
