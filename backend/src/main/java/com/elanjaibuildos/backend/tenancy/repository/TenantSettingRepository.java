package com.elanjaibuildos.backend.tenancy.repository;

import com.elanjaibuildos.backend.tenancy.domain.TenantSetting;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantSettingRepository extends JpaRepository<TenantSetting, String> {
}
