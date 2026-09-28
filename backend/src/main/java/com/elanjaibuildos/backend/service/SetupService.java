package com.elanjaibuildos.backend.service;

import com.elanjaibuildos.backend.model.TenantSetting;
import com.elanjaibuildos.backend.repository.TenantSettingRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Setup wizard state — persisted in tenant_settings["setup_wizard"] as JSON:
 * { "done": false, "steps": { "profile": false, "masters": false, "first_site": false, "team": false } }
 */
@Service
@RequiredArgsConstructor
public class SetupService {

    private static final String KEY = "setup_wizard";
    private final TenantSettingRepository settings;
    private final ObjectMapper mapper = new ObjectMapper();

    @SuppressWarnings("unchecked")
    public Map<String, Object> get() {
        return settings.findById(KEY)
                .map(s -> {
                    try { return (Map<String, Object>) mapper.readValue(s.getValue(), Map.class); }
                    catch (Exception e) { return fresh(); }
                })
                .orElseGet(this::fresh);
    }

    @Transactional
    public Map<String, Object> completeStep(String step) {
        Map<String, Object> state = get();
        Map<String, Object> steps = (Map<String, Object>) state.get("steps");
        steps.put(step, true);
        state.put("done", steps.values().stream().allMatch(Boolean.TRUE::equals));
        save(state);
        return state;
    }

    @Transactional
    public Map<String, Object> finish() {
        Map<String, Object> state = get();
        ((Map<String, Object>) state.get("steps")).replaceAll((k, v) -> true);
        state.put("done", true);
        save(state);
        return state;
    }

    @Transactional
    public Map<String, Object> reset() {
        Map<String, Object> state = fresh();
        save(state);
        return state;
    }

    private Map<String, Object> fresh() {
        Map<String, Object> steps = new LinkedHashMap<>();
        steps.put("profile", false);
        steps.put("masters", false);
        steps.put("first_site", false);
        steps.put("team", false);
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("done", false);
        m.put("steps", steps);
        return m;
    }

    private void save(Map<String, Object> state) {
        try {
            TenantSetting s = settings.findById(KEY).orElse(new TenantSetting());
            s.setKey(KEY);
            s.setValue(mapper.writeValueAsString(state));
            settings.save(s);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to persist wizard state", e);
        }
    }
}
