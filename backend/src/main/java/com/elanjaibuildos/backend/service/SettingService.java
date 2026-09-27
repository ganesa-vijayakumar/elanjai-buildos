package com.elanjaibuildos.backend.service;

import com.elanjaibuildos.backend.dto.SettingRequest;
import com.elanjaibuildos.backend.dto.SettingResponse;
import com.elanjaibuildos.backend.model.Setting;
import com.elanjaibuildos.backend.model.User;
import com.elanjaibuildos.backend.repository.SettingRepository;
import com.elanjaibuildos.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SettingService {

    private final SettingRepository settingRepository;
    private final UserRepository userRepository;

    public List<SettingResponse> getAllSettings() {
        return settingRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public SettingResponse getSettingByKey(String key) {
        return settingRepository.findByKey(key)
                .map(this::mapToResponse)
                .orElseThrow(() -> new RuntimeException("Setting not found"));
    }

    public SettingResponse updateSetting(String key, SettingRequest request) {
        User currentUser = getCurrentUser();
        Setting setting = settingRepository.findByKey(key)
                .orElse(Setting.builder().key(key).build());

        setting.setValue(request.getValue());
        setting.setUpdatedBy(currentUser);

        return mapToResponse(settingRepository.save(setting));
    }

    private User getCurrentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserDetails) {
            String email = ((UserDetails) principal).getUsername();
            return userRepository.findByEmail(email).orElseThrow();
        }
        throw new RuntimeException("User not found in context");
    }

    private SettingResponse mapToResponse(Setting setting) {
        return SettingResponse.builder()
                .id(setting.getId())
                .key(setting.getKey())
                .value(setting.getValue())
                .updatedBy(setting.getUpdatedBy() != null ? setting.getUpdatedBy().getId() : null)
                .updatedAt(setting.getUpdatedAt())
                .build();
    }
}
