package com.elanjaibuildos.backend.platform.repository;

import com.elanjaibuildos.backend.platform.domain.PlatformSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface PlatformSettingRepository extends JpaRepository<PlatformSetting, String> {
    @Query("select s.value from PlatformSetting s where s.key = :key")
    Optional<String> findValueByKey(String key);
}
