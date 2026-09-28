package com.elanjaibuildos.backend.sites.repository;

import com.elanjaibuildos.backend.sites.domain.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, UUID> {
    List<Expense> findBySiteId(UUID siteId);
}
