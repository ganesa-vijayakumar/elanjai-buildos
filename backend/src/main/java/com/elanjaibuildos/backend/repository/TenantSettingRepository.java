package com.elanjaibuildos.backend.repository;

import com.elanjaibuildos.backend.model.TenantSetting;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantSettingRepository extends JpaRepository<TenantSetting, String> {
}
