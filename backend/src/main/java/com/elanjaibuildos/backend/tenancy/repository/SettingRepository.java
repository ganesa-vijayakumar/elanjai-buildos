package com.elanjaibuildos.backend.tenancy.repository;

import com.elanjaibuildos.backend.tenancy.domain.Setting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SettingRepository extends JpaRepository<Setting, UUID> {
    Optional<Setting> findByKey(String key);
}
