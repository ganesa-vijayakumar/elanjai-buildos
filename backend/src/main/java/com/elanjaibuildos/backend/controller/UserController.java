package com.elanjaibuildos.backend.controller;

import com.elanjaibuildos.backend.dto.RegisterRequest;
import com.elanjaibuildos.backend.dto.UserResponse;
import com.elanjaibuildos.backend.model.Role;
import com.elanjaibuildos.backend.service.AuthService;
import com.elanjaibuildos.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final AuthService authService;
    private final com.elanjaibuildos.backend.repository.InviteRepository inviteRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','SITE_MANAGER')")
    public ResponseEntity<List<UserResponse>> getAllUsers(
            @RequestParam(required = false) String role) {
        if (role != null && !role.isEmpty()) {
            try {
                Role roleEnum = Role.valueOf(role.toUpperCase());
                return ResponseEntity.ok(userService.getUsersByRole(roleEnum));
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().build();
            }
        }
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','SITE_MANAGER')")
    public ResponseEntity<UserResponse> getUserById(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<UserResponse> createUser(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(userService.createUser(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<UserResponse> updateUser(@PathVariable UUID id, @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(userService.updateUser(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    // ---------- Invites (D-046: Owner/Admin invite staff; client invites link to a site) ----------
    public record InviteBody(String email, String role, UUID siteId) {}

    @PostMapping("/invite")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<?> invite(@RequestBody InviteBody b, Authentication auth) {
        try {
            Role role = Role.valueOf(b.role().toUpperCase());
            var inv = authService.invite(b.email(), role, b.siteId(), actorId(auth));
            return ResponseEntity.accepted().body(Map.of(
                    "inviteId", inv.getId(), "email", inv.getEmail(),
                    "expiresAt", inv.getExpiresAt().toString()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "BAD_REQUEST", "message", e.getMessage()));
        }
    }

    /** Pending invites — shown in the Users page. */
    @GetMapping("/invites")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<?> pendingInvites() {
        return ResponseEntity.ok(inviteRepository.findByAcceptedAtIsNullOrderByCreatedAtDesc());
    }

    /** Revoke a pending invite. */
    @DeleteMapping("/invites/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<Void> revokeInvite(@PathVariable UUID id) {
        inviteRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private UUID actorId(Authentication auth) {
        if (auth != null && auth.getDetails() instanceof Map<?, ?> d && d.get("userId") != null) {
            return UUID.fromString(d.get("userId").toString());
        }
        return null;
    }
}
