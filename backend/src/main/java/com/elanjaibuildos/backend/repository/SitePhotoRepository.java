package com.elanjaibuildos.backend.repository;

import com.elanjaibuildos.backend.model.SitePhoto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SitePhotoRepository extends JpaRepository<SitePhoto, UUID> {
    List<SitePhoto> findBySiteIdOrderByUploadedAtDesc(UUID siteId);
    List<SitePhoto> findBySiteIdAndStageIdOrderByUploadedAtDesc(UUID siteId, UUID stageId);
    Optional<SitePhoto> findByFile_Id(UUID fileId);
}
