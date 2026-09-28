package com.elanjaibuildos.backend.service;

import com.elanjaibuildos.backend.model.Site;
import com.elanjaibuildos.backend.model.SiteStage;
import com.elanjaibuildos.backend.model.StageTemplate;
import com.elanjaibuildos.backend.repository.SiteRepository;
import com.elanjaibuildos.backend.repository.SiteStageRepository;
import com.elanjaibuildos.backend.repository.StageTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Per-site construction stages — copied from stage_templates on site creation, editable after. */
@Service
@RequiredArgsConstructor
public class StageService {

    private final SiteStageRepository stages;
    private final StageTemplateRepository templates;
    private final SiteRepository sites;
    private final SiteAccessGuard siteAccessGuard;

    @Transactional
    public List<SiteStage> forSite(UUID siteId) {
        Site site = siteAccessGuard.assertReadable(siteId);
        List<SiteStage> list = stages.findBySiteIdOrderByOrderIndexAsc(siteId);
        if (list.isEmpty()) {
            // Backfill sites created before stages existed (D-034: copy templates, editable)
            copyTemplateToSite(site);
            list = stages.findBySiteIdOrderByOrderIndexAsc(siteId);
        }
        return list;
    }

    public List<StageTemplate> template() {
        return templates.findAllByOrderByOrderIndexAsc();
    }

    /** Copy stage_templates → site_stages for a new site. */
    public void copyTemplateToSite(Site site) {
        List<StageTemplate> tpl = templates.findAllByOrderByOrderIndexAsc();
        int i = 0;
        for (StageTemplate t : tpl) {
            stages.save(SiteStage.builder()
                    .site(site).name(t.getName()).percentage(t.getPercentage())
                    .budgetAmount(site.getTotalValue() != null
                            ? site.getTotalValue().multiply(t.getPercentage()).movePointLeft(2)
                            : null)
                    .status("pending").orderIndex(++i).build());
        }
    }

    /** Seed site_stages from a quotation's stageBreakdown JSON [{label|name|stage, percentage, amount}]. */
    public int copyBreakdownToSite(Site site, String stageBreakdownJson) {
        if (stageBreakdownJson == null || stageBreakdownJson.isBlank()) return 0;
        try {
            com.fasterxml.jackson.databind.ObjectMapper om = new com.fasterxml.jackson.databind.ObjectMapper();
            java.util.List<java.util.Map<String, Object>> rows = om.readValue(stageBreakdownJson,
                    new com.fasterxml.jackson.core.type.TypeReference<>() {});
            int i = 0;
            for (java.util.Map<String, Object> r : rows) {
                String name = r.get("label") != null ? r.get("label").toString()
                        : r.get("name") != null ? r.get("name").toString()
                        : r.get("stage") != null ? r.get("stage").toString() : "Stage " + (i + 1);
                BigDecimal pct = r.get("percentage") != null ? new BigDecimal(r.get("percentage").toString()) : null;
                BigDecimal budget = r.get("amount") != null ? new BigDecimal(r.get("amount").toString()) : null;
                stages.save(SiteStage.builder()
                        .site(site).name(name)
                        .percentage(pct != null ? pct : BigDecimal.ZERO)
                        .budgetAmount(budget)
                        .status("pending").orderIndex(++i).build());
            }
            return i;
        } catch (Exception e) {
            return 0; // unparseable breakdown — caller falls back to templates
        }
    }

    @Transactional
    public SiteStage add(UUID siteId, String name, BigDecimal percentage, BigDecimal budget, String notes) {
        Site site = sites.findById(siteId).orElseThrow(() -> new RuntimeException("Site not found"));
        int next = (int) (stages.countBySiteId(siteId) + 1);
        return stages.save(SiteStage.builder()
                .site(site).name(name).percentage(percentage).budgetAmount(budget)
                .status("pending").orderIndex(next).notes(notes).build());
    }

    @Transactional
    public SiteStage update(UUID stageId, Map<String, Object> patch) {
        SiteStage s = stages.findById(stageId).orElseThrow(() -> new RuntimeException("Stage not found"));
        if (patch.containsKey("name")) s.setName((String) patch.get("name"));
        if (patch.containsKey("percentage")) s.setPercentage(new BigDecimal(patch.get("percentage").toString()));
        if (patch.containsKey("budgetAmount")) s.setBudgetAmount(new BigDecimal(patch.get("budgetAmount").toString()));
        if (patch.containsKey("notes")) s.setNotes((String) patch.get("notes"));
        if (patch.containsKey("plannedStart")) s.setPlannedStart(patch.get("plannedStart") != null ? java.time.LocalDate.parse((String) patch.get("plannedStart")) : null);
        if (patch.containsKey("plannedEnd")) s.setPlannedEnd(patch.get("plannedEnd") != null ? java.time.LocalDate.parse((String) patch.get("plannedEnd")) : null);
        if (patch.containsKey("status")) {
            String st = (String) patch.get("status");
            s.setStatus(st);
            if ("in_progress".equals(st) && s.getActualStart() == null) s.setActualStart(java.time.LocalDate.now());
            if ("done".equals(st) && s.getActualEnd() == null) s.setActualEnd(java.time.LocalDate.now());
        }
        return stages.save(s);
    }

    @Transactional
    public void reorder(UUID siteId, List<UUID> orderedIds) {
        List<SiteStage> all = stages.findBySiteIdOrderByOrderIndexAsc(siteId);
        for (int i = 0; i < orderedIds.size(); i++) {
            UUID id = orderedIds.get(i);
            int idx = i + 1;
            all.stream().filter(s -> s.getId().equals(id)).findFirst()
                    .ifPresent(s -> { s.setOrderIndex(idx); stages.save(s); });
        }
    }

    @Transactional
    public void delete(UUID stageId) {
        stages.deleteById(stageId);
    }
}
