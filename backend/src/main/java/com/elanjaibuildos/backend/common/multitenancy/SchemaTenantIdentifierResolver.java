package com.elanjaibuildos.backend.common.multitenancy;

import org.hibernate.context.spi.CurrentTenantIdentifierResolver;
import org.springframework.stereotype.Component;

/**
 * Hibernate resolver: returns the tenant schema for the current request.
 * Falls back to "public" (platform realm / unauthenticated requests).
 */
@Component
public class SchemaTenantIdentifierResolver implements CurrentTenantIdentifierResolver<String> {

    public static final String PUBLIC_SCHEMA = "public";

    @Override
    public String resolveCurrentTenantIdentifier() {
        String schema = TenantContext.getSchema();
        return (schema == null || schema.isBlank()) ? PUBLIC_SCHEMA : schema;
    }

    @Override
    public boolean validateExistingCurrentSessions() {
        return true;
    }
}
