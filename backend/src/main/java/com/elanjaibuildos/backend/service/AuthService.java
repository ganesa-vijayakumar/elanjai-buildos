package com.elanjaibuildos.backend.service;

import com.elanjaibuildos.backend.dto.AuthenticationRequest;
import com.elanjaibuildos.backend.dto.AuthenticationResponse;
import com.elanjaibuildos.backend.dto.RegisterRequest;
import com.elanjaibuildos.backend.dto.UserResponse;
import com.elanjaibuildos.backend.model.Role;
import com.elanjaibuildos.backend.model.User;
import com.elanjaibuildos.backend.repository.UserRepository;
import com.elanjaibuildos.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

        private final UserRepository userRepository;
        private final PasswordEncoder passwordEncoder;
        private final JwtService jwtService;
        private final AuthenticationManager authenticationManager;

        public AuthenticationResponse register(RegisterRequest request) {
                var user = User.builder()
                                .fullName(request.getFullName())
                                .email(request.getEmail())
                                .password(passwordEncoder.encode(request.getPassword()))
                                .phone(request.getPhone())
                                .location(request.getLocation())
                                .role(request.getRole() != null ? request.getRole() : Role.CLIENT)
                                .build();
                userRepository.save(user);
                var jwtToken = jwtService.generateToken(user);
                return AuthenticationResponse.builder()
                                .token(jwtToken)
                                .user(mapToUserResponse(user))
                                .build();
        }

        public AuthenticationResponse authenticate(AuthenticationRequest request) {
                authenticationManager.authenticate(
                                new UsernamePasswordAuthenticationToken(
                                                request.getEmail(),
                                                request.getPassword()));
                var user = userRepository.findByEmail(request.getEmail())
                                .orElseThrow();
                var jwtToken = jwtService.generateToken(user);
                return AuthenticationResponse.builder()
                                .token(jwtToken)
                                .user(mapToUserResponse(user))
                                .build();
        }

        private UserResponse mapToUserResponse(User user) {
                return UserResponse.builder()
                                .id(user.getId())
                                .email(user.getEmail())
                                .fullName(user.getFullName())
                                .phone(user.getPhone())
                                .location(user.getLocation())
                                .role(user.getRole())
                                .companyName(user.getCompanyName())
                                .companyLogo(user.getCompanyLogo())
                                .build();
        }
}
