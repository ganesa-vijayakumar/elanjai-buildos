package com.elanjaibuildos.backend.identity.service;

import com.elanjaibuildos.backend.identity.domain.Role;
import com.elanjaibuildos.backend.identity.api.RegisterRequest;
import com.elanjaibuildos.backend.identity.api.UserResponse;
import com.elanjaibuildos.backend.identity.domain.User;
import com.elanjaibuildos.backend.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UsernameService usernames;

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public UserResponse getUserById(UUID id) {
        return userRepository.findById(id)
                .map(this::mapToResponse)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    /** Staff user creation — full invite flow lives in AuthService.invite/acceptInvite. */
    public UserResponse createUser(RegisterRequest request) {
        String email = request.getEmail() == null ? null : request.getEmail().toLowerCase();
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already exists");
        }
        usernames.assertEmailNotUsername(email);
        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone());
        user.setRole(request.getRole() != null ? request.getRole() : Role.CLIENT);
        user.setStatus("active");
        // new users always get a canonical username: explicit override or derived
        if (request.getUsername() != null && !request.getUsername().isBlank()) {
            usernames.assignExplicit(user, request.getUsername(), tenantSlug());
        } else {
            usernames.assignDerived(user, tenantSlug());
        }
        return mapToResponse(userRepository.save(user));
    }

    public UserResponse updateUser(UUID id, RegisterRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        if (request.getRole() != null) {
            user.setRole(request.getRole());
        }
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }
        // username set/reset — explicit only; null leaves the current value untouched
        if (request.getUsername() != null && !request.getUsername().isBlank()) {
            usernames.assignExplicit(user, request.getUsername(), tenantSlug());
        }
        return mapToResponse(userRepository.save(user));
    }

    public List<UserResponse> getUsersByRole(Role role) {
        return userRepository.findByRole(role).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public void deleteUser(UUID id) {
        userRepository.deleteById(id);
    }

    private String tenantSlug() {
        String slug = com.elanjaibuildos.backend.common.multitenancy.TenantContext.getSlug();
        if (slug == null) throw new IllegalStateException("No tenant context bound to this request");
        return slug;
    }

    private UserResponse mapToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .role(user.getRole())
                .status(user.getStatus())
                .build();
    }
}
