package com.elanjaibuildos.backend.common.multitenancy;

import org.hibernate.cfg.AvailableSettings;
import org.hibernate.context.spi.CurrentTenantIdentifierResolver;
import org.hibernate.engine.jdbc.connections.spi.MultiTenantConnectionProvider;
import org.springframework.boot.hibernate.autoconfigure.HibernatePropertiesCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.util.Map;

@Configuration
public class HibernateMultiTenancyConfig implements HibernatePropertiesCustomizer {

    private final DataSource dataSource;

    public HibernateMultiTenancyConfig(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Bean
    public MultiTenantConnectionProvider<String> multiTenantConnectionProvider() {
        return new SchemaMultiTenantConnectionProvider(dataSource);
    }

    @Bean
    public CurrentTenantIdentifierResolver<String> tenantIdentifierResolver() {
        return new SchemaTenantIdentifierResolver();
    }

    @Override
    public void customize(Map<String, Object> hibernateProperties) {
        hibernateProperties.put(AvailableSettings.MULTI_TENANT_CONNECTION_PROVIDER,
                multiTenantConnectionProvider());
        hibernateProperties.put(AvailableSettings.MULTI_TENANT_IDENTIFIER_RESOLVER,
                tenantIdentifierResolver());
    }
}
