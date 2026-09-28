package com.elanjaibuildos.backend.security;

import com.elanjaibuildos.backend.common.web.TenantLifecycleGuardFilter;
import com.elanjaibuildos.backend.common.web.TenantResolutionFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import com.elanjaibuildos.backend.platform.domain.Tenant;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfiguration {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final TenantResolutionFilter tenantResolutionFilter;
    private final TenantLifecycleGuardFilter lifecycleGuardFilter;

    /** Comma-separated origin allow-list (patterns ok). Same-origin /api calls need no CORS. */
    @Value("${app.cors.allowed-origins:http://localhost:5173,http://*.localhost:5173}")
    private String corsAllowedOrigins;

    public SecurityConfiguration(JwtAuthenticationFilter jwtAuthFilter,
                                 TenantResolutionFilter tenantResolutionFilter,
                                 TenantLifecycleGuardFilter lifecycleGuardFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.tenantResolutionFilter = tenantResolutionFilter;
        this.lifecycleGuardFilter = lifecycleGuardFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeHttpRequests(auth -> auth
                // public realm
                .requestMatchers("/api/public/**", "/", "/error").permitAll()
                .requestMatchers("/webhooks/**").permitAll()
                // platform admin realm
                .requestMatchers("/api/admin/auth/login").permitAll()
                .requestMatchers("/api/admin/**").hasRole("PLATFORM_ADMIN")
                .requestMatchers("/api/platform/**").hasAnyRole("PLATFORM_ADMIN", "PLATFORM_SUPPORT")
                // tenant realm — auth endpoints open, rest authenticated
                .requestMatchers("/api/auth/login", "/api/auth/authenticate",
                                 "/api/auth/accept-invite",
                                 "/api/auth/forgot-password", "/api/auth/reset-password").permitAll()
                .anyRequest().authenticated())
            .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            // order: resolve tenant → lifecycle guard → jwt auth → controller
            .addFilterBefore(tenantResolutionFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterAfter(lifecycleGuardFilter, TenantResolutionFilter.class)
            .addFilterAfter(jwtAuthFilter, TenantLifecycleGuardFilter.class);

        return http.build();
    }

    @Bean
    public org.springframework.web.cors.CorsConfigurationSource corsConfigurationSource() {
        var configuration = new org.springframework.web.cors.CorsConfiguration();
        configuration.setAllowedOriginPatterns(
                java.util.Arrays.stream(corsAllowedOrigins.split(","))
                        .map(String::trim).filter(s -> !s.isEmpty()).toList());
        configuration.setAllowedMethods(java.util.List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(java.util.List.of("Authorization", "Content-Type", "X-Tenant-ID"));
        configuration.setAllowCredentials(true);
        var source = new org.springframework.web.cors.UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
