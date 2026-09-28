package com.elanjaibuildos.backend.files.service;

import com.elanjaibuildos.backend.common.multitenancy.TenantContext;
import com.elanjaibuildos.backend.files.domain.FileRef;
import com.elanjaibuildos.backend.identity.domain.User;
import com.elanjaibuildos.backend.files.repository.FileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

/** Local-volume file storage (D-048). Path: <root>/<tenantSlug>/<kind>/<uuid>.<ext> */
@Service
@RequiredArgsConstructor
public class FileStorageService {

    private static final Set<String> ALLOWED_KINDS = Set.of("photo", "bill", "logo");
    private static final long MAX_BYTES = 15L * 1024 * 1024; // 15 MB

    private final FileRepository files;

    @Value("${app.storage.root:./data/files}")
    private String storageRoot;

    public FileRef store(MultipartFile file, String kind, User uploader) {
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("Empty file");
        if (!ALLOWED_KINDS.contains(kind)) throw new IllegalArgumentException("Unsupported kind: " + kind);
        if (file.getSize() > MAX_BYTES) throw new IllegalArgumentException("File exceeds 15 MB");
        String ct = file.getContentType() != null ? file.getContentType() : "";
        if ("photo".equals(kind) && !ct.startsWith("image/"))
            throw new IllegalArgumentException("Only image uploads are allowed for photos");

        String slug = TenantContext.getSlug() != null ? TenantContext.getSlug() : "common";
        String ext = extOf(file.getOriginalFilename());
        Path dir = Path.of(storageRoot, slug, kind);
        try {
            Files.createDirectories(dir);
            Path target = dir.resolve(UUID.randomUUID() + ext);
            Files.write(target, file.getBytes());

            FileRef ref = FileRef.builder()
                    .path(target.toString())
                    .contentType(ct.isBlank() ? "application/octet-stream" : ct)
                    .sizeBytes(file.getSize())
                    .kind(kind)
                    .uploadedBy(uploader)
                    .build();
            return files.save(ref);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to store file", e);
        }
    }

    public Resource load(FileRef ref) {
        return new FileSystemResource(ref.getPath());
    }

    private String extOf(String name) {
        if (name == null) return "";
        int i = name.lastIndexOf('.');
        return i >= 0 ? name.substring(i).toLowerCase(Locale.ROOT) : "";
    }
}
