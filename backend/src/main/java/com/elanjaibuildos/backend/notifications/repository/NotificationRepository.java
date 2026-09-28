package com.elanjaibuildos.backend.notifications.repository;

import com.elanjaibuildos.backend.notifications.domain.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    /** Feed for a user: broadcast (user_id null) + direct. */
    @Query("SELECT n FROM Notification n WHERE n.user IS NULL OR n.user.id = :userId ORDER BY n.createdAt DESC")
    List<Notification> feedFor(UUID userId);
}
