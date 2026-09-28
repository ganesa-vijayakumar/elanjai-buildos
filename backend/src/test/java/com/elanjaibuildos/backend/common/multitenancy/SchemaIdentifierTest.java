package com.elanjaibuildos.backend.common.multitenancy;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * Slug → schema identifier rules: lowercase alnum+hyphen slugs (3-30) map to
 * t_<slug>, everything else is rejected; quoted identifiers must be safely
 * generated for hyphenated names and refuse anything not matching t_<slug>.
 */
class SchemaIdentifierTest {

    @Test
    void schemaForMapsValidSlugs() {
        assertEquals("t_acme", TenantSchemaProvisioner.schemaFor("acme"));
        assertEquals("t_acme-shop", TenantSchemaProvisioner.schemaFor("acme-shop"));
        assertEquals("t_a1b2c3", TenantSchemaProvisioner.schemaFor("a1b2c3"));
        assertEquals("t_abc", TenantSchemaProvisioner.schemaFor("abc")); // minimum length
    }

    @Test
    void schemaForRejectsInvalidSlugs() {
        for (String bad : new String[]{null, "", "a", "ab", "-abc", "abc-", "AbC",
                "a_b", "a.b", "a;b", "a b", "a".repeat(31), "élanjai"}) {
            assertThrows(IllegalArgumentException.class,
                    () -> TenantSchemaProvisioner.schemaFor(bad), "slug: " + bad);
        }
    }

    @Test
    void quotedSchemaQuotesHyphenatedNames() {
        assertEquals("\"t_acme-shop\"", TenantSchemaProvisioner.quoteIdent("t_acme-shop"));
        assertEquals("\"t_acme\"", SchemaMultiTenantConnectionProvider.quotedSchema("t_acme"));
    }

    @Test
    void quotedSchemaRefusesUnsafeIdentifiers() {
        // "public" is the platform realm's schema — allowed through the provider
        assertEquals("\"public\"",
                SchemaMultiTenantConnectionProvider.quotedSchema("public"));

        for (String bad : new String[]{null, "", "acme", "t_", "t_x",
                "t_a'; DROP SCHEMA public; --", "t_A", "x_acme",
                "t_" + "a".repeat(31)}) {
            assertThrows(IllegalArgumentException.class,
                    () -> SchemaMultiTenantConnectionProvider.quotedSchema(bad), "schema: " + bad);
            assertThrows(IllegalArgumentException.class,
                    () -> TenantSchemaProvisioner.quoteIdent(bad), "schema: " + bad);
        }
    }
}
