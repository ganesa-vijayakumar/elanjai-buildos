package com.elanjaibuildos.backend.config;

import com.elanjaibuildos.backend.model.Role;
import com.elanjaibuildos.backend.model.User;
import com.elanjaibuildos.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
public class DataInitializer {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    public CommandLineRunner initializeData() {
        return args -> {
            createUserIfNotFound("admin@demo.com", "Brand Admin", "+91 99999 99999", "admin123", Role.ADMIN);
            createUserIfNotFound("owner@demo.com", "Demo Owner", "+91 88888 88888", "owner123", Role.OWNER);
            createUserIfNotFound("manager@demo.com", "Site Manager", "+91 77777 77777", "manager123",
                    Role.SITE_MANAGER);
            createUserIfNotFound("client@demo.com", "Demo Client", "+91 66666 66666", "client123", Role.CLIENT);
        };
    }

    private void createUserIfNotFound(String email, String fullName, String phone, String password, Role role) {
        User user = userRepository.findByEmail(email)
                .orElse(User.builder()
                        .email(email)
                        .build());

        user.setFullName(fullName);
        user.setPhone(phone);
        user.setRole(role);
        // Only update password if it's a new user or explicitly requested (preserving
        // existing passwords in prod, but for demo it's fine to reset)
        // For demo simplicity, we'll reset it to ensure the demo credentials work
        user.setPassword(passwordEncoder.encode(password));

        userRepository.save(user);
        System.out.println("Upserted user: " + email + " (" + role + ")");
    }
}
