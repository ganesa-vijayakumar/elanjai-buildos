package com.elanjaibuildos.backend.repository;

import com.elanjaibuildos.backend.model.FileRef;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface FileRepository extends JpaRepository<FileRef, UUID> {
}
