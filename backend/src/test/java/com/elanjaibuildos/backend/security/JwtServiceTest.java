package com.elanjaibuildos.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

/** Dual-realm JWT claims contract. */
class JwtServiceTest {

    private JwtService jwt;

    @BeforeEach
    void setUp() {
        jwt = new JwtService();
        ReflectionTestUtils.setField(jwt, "secretKey",
                "test-jwt-secret-0123456789abcdef0123456789abcdef0123456789abcdef");
        ReflectionTestUtils.setField(jwt, "jwtExpiration", 3_600_000L);
    }

    @Test
    void tenantTokenCarriesRealmTenantAndSlug() {
        String token = jwt.generateTenantToken("owner@acme.test", "acme", "OWNER");
        Claims claims = jwt.parse(token);
        assertEquals(JwtService.REALM_TENANT, claims.get("realm", String.class));
        assertEquals("acme", claims.get("tenant", String.class));
        assertEquals("OWNER", claims.get("role", String.class));
        assertEquals("owner@acme.test", claims.getSubject());
        assertFalse(jwt.isExpired(claims));
    }

    @Test
    void platformTokenCarriesRealmPlatformAndNoTenant() {
        String token = jwt.generatePlatformToken("admin@elanjai.local", "PLATFORM_ADMIN");
        Claims claims = jwt.parse(token);
        assertEquals(JwtService.REALM_PLATFORM, claims.get("realm", String.class));
        assertNull(claims.get("tenant", String.class));
        assertEquals("PLATFORM_ADMIN", claims.get("role", String.class));
    }

    @Test
    void actionTokenCarriesRealmActionAndPurpose() {
        String token = jwt.generateActionToken("u@x.test", "password-reset", 60_000);
        Claims claims = jwt.parse(token);
        assertEquals("action", claims.get("realm", String.class));
        assertEquals("password-reset", claims.get("purpose", String.class));
    }

    @Test
    void tamperedOrForeignSecretTokenIsRejected() {
        String token = jwt.generateTenantToken("u@x.test", "acme", "OWNER");
        JwtService other = new JwtService();
        ReflectionTestUtils.setField(other, "secretKey",
                "different-secret-0123456789abcdef0123456789abcdef0123456789ab");
        assertThrows(JwtException.class, () -> other.parse(token));
        assertThrows(JwtException.class, () -> jwt.parse(token + "x"));
    }

    @Test
    void expiredTokenIsRejectedOnParse() {
        String token = jwt.generateActionToken("u@x.test", "password-reset", -1000);
        assertThrows(JwtException.class, () -> jwt.parse(token));
    }
}
