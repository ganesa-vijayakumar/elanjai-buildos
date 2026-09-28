package com.elanjaibuildos.backend.controller;

import com.elanjaibuildos.backend.dto.AuthenticationResponse;
import com.elanjaibuildos.backend.model.Role;
import com.elanjaibuildos.backend.service.AuthService;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/** Tenant-realm auth — requires resolved tenant context (host or X-Tenant-ID). */
@RestController
@RequestMapping("/api/auth")
public class AuthenticationController {

    private final AuthService auth;

    public AuthenticationController(AuthService auth) { this.auth = auth; }

    public record LoginBody(@NotBlank @Email String email, @NotBlank String password) {}

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginBody b) {
        try {
            return ResponseEntity.ok(auth.login(b.email(), b.password()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401)
                    .body(Map.of("error", "UNAUTHORIZED", "message", e.getMessage()));
        }
    }

    // legacy alias kept for the existing frontend during transition
    @PostMapping("/authenticate")
    public ResponseEntity<?> authenticate(@RequestBody LoginBody b) { return login(b); }

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {
        if (authentication == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(auth.me(authentication.getName()));
    }

    public record AcceptInviteBody(@NotBlank String token, String fullName,
                                   @NotBlank @Size(min = 8) String password) {}

    @PostMapping("/accept-invite")
    public ResponseEntity<?> acceptInvite(@RequestBody AcceptInviteBody b) {
        try {
            AuthenticationResponse r = auth.acceptInvite(b.token(), b.fullName(), b.password());
            return ResponseEntity.ok(r);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "INVALID_INVITE", "message", e.getMessage()));
        }
    }

    public record ForgotBody(@NotBlank @Email String email) {}

    @PostMapping("/forgot-password")
    public Map<String, String> forgot(@RequestBody ForgotBody b) {
        auth.forgotPassword(b.email());
        return Map.of("status", "ok");
    }

    public record ResetBody(@NotBlank String token, @NotBlank @Size(min = 8) String password) {}

    @PostMapping("/reset-password")
    public ResponseEntity<?> reset(@RequestBody ResetBody b) {
        try {
            auth.resetPassword(b.token(), b.password());
            return ResponseEntity.ok(Map.of("status", "ok"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "INVALID_TOKEN", "message", e.getMessage()));
        }
    }
}
