package com.elanjaibuildos.backend.identity.web;

import com.elanjaibuildos.backend.identity.api.AuthenticationResponse;
import com.elanjaibuildos.backend.identity.domain.Role;
import com.elanjaibuildos.backend.identity.service.AuthService;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;
import com.elanjaibuildos.backend.platform.domain.Tenant;

/** Tenant-realm auth — requires resolved tenant context (host or X-Tenant-ID). */
@RestController
@RequestMapping("/api/auth")
public class AuthenticationController {

    private final AuthService auth;

    public AuthenticationController(AuthService auth) { this.auth = auth; }

    /** identifier = email | <local> | <local>@<slug>; `email` kept as legacy field name. */
    public record LoginBody(String identifier, String email, @NotBlank String password) {
        public String loginId() { return identifier != null && !identifier.isBlank() ? identifier : email; }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginBody b) {
        try {
            return ResponseEntity.ok(auth.login(b.loginId(), b.password()));
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

    /** identifier = email | <local> | <local>@<slug>; resolved server-side, silent on miss. */
    public record ForgotBody(String identifier, String email) {
        public String loginId() { return identifier != null && !identifier.isBlank() ? identifier : email; }
    }

    @PostMapping("/forgot-password")
    public Map<String, String> forgot(@RequestBody ForgotBody b) {
        auth.forgotPassword(b.loginId());
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
