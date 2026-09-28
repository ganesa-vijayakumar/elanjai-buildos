package com.elanjaibuildos.backend.notifications.service;

import com.elanjaibuildos.backend.notifications.domain.Notification;
import com.elanjaibuildos.backend.identity.domain.User;
import com.elanjaibuildos.backend.notifications.repository.NotificationRepository;
import com.elanjaibuildos.backend.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notifications;
    private final UserRepository users;

    public List<Notification> feed() {
        return notifications.feedFor(currentUser().getId());
    }

    public long unreadCount() {
        UUID uid = currentUser().getId();
        return feed().stream()
                .filter(n -> n.getReadBy() == null || !n.getReadBy().contains(uid.toString()))
                .count();
    }

    @Transactional
    public void markRead(UUID id) {
        Notification n = notifications.findById(id).orElseThrow();
        String uid = currentUser().getId().toString();
        if (n.getReadBy() == null) n.setReadBy(new ArrayList<>());
        if (!n.getReadBy().contains(uid)) n.getReadBy().add(uid);
        notifications.save(n);
    }

    @Transactional
    public void markAllRead() {
        String uid = currentUser().getId().toString();
        for (Notification n : feed()) {
            if (n.getReadBy() == null) n.setReadBy(new ArrayList<>());
            if (!n.getReadBy().contains(uid)) { n.getReadBy().add(uid); notifications.save(n); }
        }
    }

    /** Broadcast to all tenant users (user_id null). */
    @Transactional
    public void broadcast(String type, String title, String message, String link) {
        notifications.save(Notification.builder()
                .type(type).title(title).message(message).link(link)
                .readBy(new ArrayList<>()).build());
    }

    /** Direct to one tenant user. */
    @Transactional
    public void toUser(UUID userId, String type, String title, String message, String link) {
        Notification n = Notification.builder()
                .type(type).title(title).message(message).link(link)
                .readBy(new ArrayList<>()).build();
        users.findById(userId).ifPresent(n::setUser);
        notifications.save(n);
    }

    private User currentUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        return users.findByEmail(auth.getName()).orElseThrow();
    }
}
