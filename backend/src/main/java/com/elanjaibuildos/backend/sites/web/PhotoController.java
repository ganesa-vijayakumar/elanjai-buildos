package com.elanjaibuildos.backend.sites.web;

import com.elanjaibuildos.backend.files.domain.FileRef;
import com.elanjaibuildos.backend.sites.domain.Site;
import com.elanjaibuildos.backend.sites.domain.SitePhoto;
import com.elanjaibuildos.backend.identity.domain.User;
import com.elanjaibuildos.backend.files.repository.FileRepository;
import com.elanjaibuildos.backend.identity.repository.UserRepository;
import com.elanjaibuildos.backend.sites.repository.SitePhotoRepository;
import com.elanjaibuildos.backend.sites.repository.SiteRepository;
import com.elanjaibuildos.backend.sites.repository.SiteStageRepository;
import com.elanjaibuildos.backend.files.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import com.elanjaibuildos.backend.sites.service.SiteAccessGuard;
import com.elanjaibuildos.backend.files.repository.FileRepository;
import com.elanjaibuildos.backend.sites.repository.SitePhotoRepository;
import com.elanjaibuildos.backend.sites.repository.SiteRepository;
import com.elanjaibuildos.backend.sites.repository.SiteStageRepository;
import com.elanjaibuildos.backend.identity.repository.UserRepository;

/** Site progress photos (F-052) + file download. */
@RestController
@RequiredArgsConstructor
public class PhotoController {

    private final SitePhotoRepository photos;
    private final SiteRepository sites;
    private final SiteStageRepository stages;
    private final FileRepository files;
    private final UserRepository users;
    private final FileStorageService storage;
    private final com.elanjaibuildos.backend.sites.service.SiteAccessGuard guard;

    @GetMapping("/api/sites/{siteId}/photos")
    public List<Map<String, Object>> list(@PathVariable UUID siteId,
                                          @RequestParam(required = false) UUID stageId) {
        guard.assertReadable(siteId);
        List<SitePhoto> rows = stageId != null
                ? photos.findBySiteIdAndStageIdOrderByUploadedAtDesc(siteId, stageId)
                : photos.findBySiteIdOrderByUploadedAtDesc(siteId);
        return rows.stream().map(this::toDto).toList();
    }

    @PostMapping("/api/sites/{siteId}/photos")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','SITE_MANAGER')")
    public ResponseEntity<?> upload(@PathVariable UUID siteId,
                                    @RequestParam("file") MultipartFile file,
                                    @RequestParam(required = false) UUID stageId,
                                    @RequestParam(required = false) String caption) {
        Site site = sites.findById(siteId).orElseThrow();
        FileRef ref = storage.store(file, "photo", currentUser());
        SitePhoto p = SitePhoto.builder()
                .site(site).file(ref).caption(caption).uploadedBy(currentUser())
                .build();
        if (stageId != null) p.setStage(stages.findById(stageId).orElse(null));
        return ResponseEntity.ok(toDto(photos.save(p)));
    }

    @DeleteMapping("/api/photos/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        photos.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    /** Stream a stored file (tenant-scoped via files table in the tenant schema). */
    @GetMapping("/api/files/{id}")
    public ResponseEntity<Resource> download(@PathVariable UUID id) {
        FileRef ref = files.findById(id).orElseThrow();
        photos.findByFile_Id(id).ifPresent(p -> guard.assertOwner(p.getSite()));
        Resource res = storage.load(ref);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(ref.getContentType() != null
                        ? ref.getContentType() : "application/octet-stream"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .body(res);
    }

    private Map<String, Object> toDto(SitePhoto p) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", p.getId());
        m.put("fileId", p.getFile().getId());
        m.put("url", "/api/files/" + p.getFile().getId());
        m.put("caption", p.getCaption());
        m.put("stageId", p.getStage() != null ? p.getStage().getId() : null);
        m.put("stageName", p.getStage() != null ? p.getStage().getName() : null);
        m.put("uploadedBy", p.getUploadedBy() != null ? p.getUploadedBy().getFullName() : null);
        m.put("uploadedAt", p.getUploadedAt());
        return m;
    }

    private User currentUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) throw new RuntimeException("User not found in context");
        return users.findByEmail(auth.getName()).orElseThrow();
    }
}
