package com.elanjaibuildos.backend.controller;

import com.elanjaibuildos.backend.service.SetupService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** Setup wizard state (SCR-036) — per-tenant, persisted in tenant_settings. */
@RestController
@RequestMapping("/api/setup")
@RequiredArgsConstructor
public class SetupController {

    private final SetupService setup;

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','SITE_MANAGER')")
    public Map<String, Object> state() {
        return setup.get();
    }

    public record StepBody(String step) {}

    @PostMapping("/step")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public Map<String, Object> completeStep(@RequestBody StepBody b) {
        return setup.completeStep(b.step());
    }

    @PostMapping("/finish")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public Map<String, Object> finish() {
        return setup.finish();
    }

    @PostMapping("/reset")
    @PreAuthorize("hasRole('OWNER')")
    public Map<String, Object> reset() {
        return setup.reset();
    }
}
