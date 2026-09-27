package com.elanjaibuildos.backend.controller;

import com.elanjaibuildos.backend.dto.SettingRequest;
import com.elanjaibuildos.backend.dto.SettingResponse;
import com.elanjaibuildos.backend.service.SettingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SettingController {

    private final SettingService settingService;

    @GetMapping
    public ResponseEntity<List<SettingResponse>> getAllSettings() {
        return ResponseEntity.ok(settingService.getAllSettings());
    }

    @GetMapping("/{key}")
    public ResponseEntity<SettingResponse> getSettingByKey(@PathVariable String key) {
        return ResponseEntity.ok(settingService.getSettingByKey(key));
    }

    @PutMapping("/{key}")
    public ResponseEntity<SettingResponse> updateSetting(@PathVariable String key,
            @RequestBody SettingRequest request) {
        return ResponseEntity.ok(settingService.updateSetting(key, request));
    }
}
