package com.elanjaibuildos.backend.files.repository;

import com.elanjaibuildos.backend.files.domain.FileRef;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface FileRepository extends JpaRepository<FileRef, UUID> {
}
