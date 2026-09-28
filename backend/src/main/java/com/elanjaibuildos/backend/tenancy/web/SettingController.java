package com.elanjaibuildos.backend.tenancy.web;

import com.elanjaibuildos.backend.tenancy.api.SettingRequest;
import com.elanjaibuildos.backend.tenancy.api.SettingResponse;
import com.elanjaibuildos.backend.files.domain.FileRef;
import com.elanjaibuildos.backend.identity.domain.User;
import com.elanjaibuildos.backend.identity.repository.UserRepository;
import com.elanjaibuildos.backend.files.service.FileStorageService;
import com.elanjaibuildos.backend.tenancy.service.SettingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import com.elanjaibuildos.backend.platform.domain.Tenant;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SettingController {

    private final SettingService settingService;
    private final FileStorageService storage;
    private final UserRepository users;

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','SITE_MANAGER')")
    public ResponseEntity<List<SettingResponse>> getAllSettings() {
        return ResponseEntity.ok(settingService.getAllSettings());
    }

    @GetMapping("/{key}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','SITE_MANAGER')")
    public ResponseEntity<SettingResponse> getSettingByKey(@PathVariable String key) {
        return ResponseEntity.ok(settingService.getSettingByKey(key));
    }

    @PutMapping("/{key}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<SettingResponse> updateSetting(@PathVariable String key,
            @RequestBody SettingRequest request) {
        return ResponseEntity.ok(settingService.updateSetting(key, request));
    }

    /** Tenant logo upload (branding). Returns the file id + url to store in the 'branding' setting. */
    @PostMapping("/branding/logo")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<Map<String, Object>> uploadLogo(@RequestParam("file") MultipartFile file) {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        User me = users.findByEmail(auth.getName()).orElseThrow();
        FileRef ref = storage.store(file, "logo", me);
        return ResponseEntity.ok(Map.of("fileId", ref.getId(), "url", "/api/files/" + ref.getId()));
    }
}
