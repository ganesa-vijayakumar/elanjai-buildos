package com.elanjaibuildos.backend.platform.controller;

import com.elanjaibuildos.backend.platform.model.PlatformUser;
import com.elanjaibuildos.backend.platform.repository.PlatformUserRepository;
import com.elanjaibuildos.backend.security.JwtService;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;

/** Platform-realm login for super-admin / support (admin.<domain> or dev header). */
@RestController
@RequestMapping("/api/admin/auth")
public class AdminAuthController {

    private final PlatformUserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public AdminAuthController(PlatformUserRepository users, PasswordEncoder encoder, JwtService jwt) {
        this.users = users; this.encoder = encoder; this.jwt = jwt;
    }

    public record LoginBody(@NotBlank String email, @NotBlank String password) {}

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginBody b) {
        var user = users.findByEmail(b.email().toLowerCase());
        if (user.isEmpty() || !encoder.matches(b.password(), user.get().getPassword())
                || !Boolean.TRUE.equals(user.get().getActive())) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "UNAUTHORIZED", "message", "Invalid credentials."));
        }
        PlatformUser u = user.get();
        u.setLastLoginAt(Instant.now());
        users.save(u);
        return ResponseEntity.ok(Map.of(
                "token", jwt.generatePlatformToken(u.getEmail(), u.getRole().name()),
                "user", Map.of("email", u.getEmail(), "name", u.getName(), "role", u.getRole().name())));
    }
}
