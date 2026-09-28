package com.elanjaibuildos.backend.notifications.web;

import com.elanjaibuildos.backend.notifications.domain.Notification;
import com.elanjaibuildos.backend.notifications.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notifications;

    @GetMapping
    public List<Notification> feed() {
        return notifications.feed();
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unread() {
        return Map.of("count", notifications.unreadCount());
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable UUID id) {
        notifications.markRead(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllRead() {
        notifications.markAllRead();
        return ResponseEntity.noContent().build();
    }
}
