package com.elanjaibuildos.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * Dual-realm JWT service.
 *  - realm=platform : platform_users (super-admin / support) — no tenant claim
 *  - realm=tenant   : tenant users — carries slug + schema + role claims
 */
@Service
public class JwtService {

    public static final String REALM_PLATFORM = "platform";
    public static final String REALM_TENANT = "tenant";

    @Value("${app.jwt.secret}")
    private String secretKey;

    @Value("${app.jwt.expiration-ms:86400000}")
    private long jwtExpiration;

    public String generatePlatformToken(String email, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("realm", REALM_PLATFORM);
        claims.put("role", role);
        return build(claims, email, jwtExpiration);
    }

    public String generateTenantToken(String email, String tenantSlug, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("realm", REALM_TENANT);
        claims.put("tenant", tenantSlug);
        claims.put("role", role);
        return build(claims, email, jwtExpiration);
    }

    /** Password-reset / invite tokens — short lived, purpose-bound. */
    public String generateActionToken(String email, String purpose, long ttlMs) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("realm", "action");
        claims.put("purpose", purpose);
        return build(claims, email, ttlMs);
    }

    private String build(Map<String, Object> claims, String subject, long ttlMs) {
        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + ttlMs))
                .signWith(key())
                .compact();
    }

    public Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(key())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean isExpired(Claims claims) {
        return claims.getExpiration().before(new Date());
    }

    private SecretKey key() {
        return Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
    }
}
