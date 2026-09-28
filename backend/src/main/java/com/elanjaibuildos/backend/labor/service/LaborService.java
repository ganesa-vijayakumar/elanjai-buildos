package com.elanjaibuildos.backend.labor.service;

import com.elanjaibuildos.backend.identity.domain.User;
import com.elanjaibuildos.backend.labor.domain.AttendanceRecord;
import com.elanjaibuildos.backend.labor.domain.DailyAttendance;
import com.elanjaibuildos.backend.labor.domain.Worker;
import com.elanjaibuildos.backend.labor.domain.WorkerAdvance;
import com.elanjaibuildos.backend.sites.domain.Site;
import com.elanjaibuildos.backend.identity.repository.UserRepository;
import com.elanjaibuildos.backend.labor.repository.AttendanceRecordRepository;
import com.elanjaibuildos.backend.labor.repository.DailyAttendanceRepository;
import com.elanjaibuildos.backend.labor.repository.WorkerAdvanceRepository;
import com.elanjaibuildos.backend.labor.repository.WorkerRepository;
import com.elanjaibuildos.backend.sites.repository.SiteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import com.elanjaibuildos.backend.labor.domain.AttendanceRecord;
import com.elanjaibuildos.backend.labor.domain.DailyAttendance;
import com.elanjaibuildos.backend.sites.domain.Site;
import com.elanjaibuildos.backend.identity.domain.User;
import com.elanjaibuildos.backend.labor.domain.Worker;
import com.elanjaibuildos.backend.labor.domain.WorkerAdvance;
import com.elanjaibuildos.backend.labor.repository.AttendanceRecordRepository;
import com.elanjaibuildos.backend.labor.repository.DailyAttendanceRepository;
import com.elanjaibuildos.backend.sites.repository.SiteRepository;
import com.elanjaibuildos.backend.identity.repository.UserRepository;
import com.elanjaibuildos.backend.labor.repository.WorkerAdvanceRepository;
import com.elanjaibuildos.backend.labor.repository.WorkerRepository;

/** Labor: workers, daily attendance sheets with wage calc, salary advances (F-046). */
@Service
@RequiredArgsConstructor
public class LaborService {

    private final WorkerRepository workers;
    private final DailyAttendanceRepository sheets;
    private final AttendanceRecordRepository records;
    private final WorkerAdvanceRepository advances;
    private final SiteRepository sites;
    private final UserRepository users;

    // ---------- workers ----------
    public List<Worker> listWorkers(UUID siteId, boolean activeOnly) {
        return activeOnly
                ? workers.findBySiteIdAndStatusOrderByNameAsc(siteId, "active")
                : workers.findBySiteIdOrderByNameAsc(siteId);
    }

    @Transactional
    public Worker addWorker(UUID siteId, String name, String phone, String type, BigDecimal dailyWage) {
        Site site = sites.findById(siteId).orElseThrow(() -> new RuntimeException("Site not found"));
        return workers.save(Worker.builder()
                .site(site).name(name).phone(phone).type(type).dailyWage(dailyWage)
                .status("active").advanceBalance(BigDecimal.ZERO).build());
    }

    @Transactional
    public Worker updateWorker(UUID id, Map<String, Object> p) {
        Worker w = workers.findById(id).orElseThrow(() -> new RuntimeException("Worker not found"));
        if (p.containsKey("name")) w.setName((String) p.get("name"));
        if (p.containsKey("phone")) w.setPhone((String) p.get("phone"));
        if (p.containsKey("type")) w.setType((String) p.get("type"));
        if (p.containsKey("dailyWage")) w.setDailyWage(new BigDecimal(p.get("dailyWage").toString()));
        if (p.containsKey("status")) w.setStatus((String) p.get("status"));
        return workers.save(w);
    }

    // ---------- attendance ----------
    public List<DailyAttendance> listSheets(UUID siteId, LocalDate from, LocalDate to) {
        return sheets.findBySiteIdAndDateBetweenOrderByDateDesc(siteId, from, to);
    }

    public List<AttendanceRecord> sheetRows(UUID attendanceId) {
        return records.findByAttendanceId(attendanceId);
    }

    /**
     * Mark a whole day for a site. rows: [{workerId, status, overtimeHours?}]
     * present=1.0x daily wage, half_day=0.5x, absent=0. Re-marking the same day replaces rows.
     */
    @Transactional
    public DailyAttendance mark(UUID siteId, LocalDate date, List<Map<String, Object>> rows, String notes) {
        Site site = sites.findById(siteId).orElseThrow(() -> new RuntimeException("Site not found"));
        User me = currentUser();

        DailyAttendance sheet = sheets.findBySiteIdAndDate(siteId, date)
                .orElseGet(() -> sheets.save(DailyAttendance.builder()
                        .site(site).date(date).markedBy(me).markedAt(Instant.now()).notes(notes).build()));
        sheet.setNotes(notes);
        sheet.setMarkedBy(me);
        sheet.setMarkedAt(Instant.now());
        sheets.save(sheet);

        // replace rows
        records.deleteAll(records.findByAttendanceId(sheet.getId()));
        for (Map<String, Object> r : rows) {
            Worker w = workers.findById(UUID.fromString(r.get("workerId").toString()))
                    .orElseThrow(() -> new RuntimeException("Worker not found"));
            String status = r.getOrDefault("status", "present").toString();
            BigDecimal ot = r.get("overtimeHours") != null
                    ? new BigDecimal(r.get("overtimeHours").toString()) : BigDecimal.ZERO;

            BigDecimal factor = switch (status) {
                case "present" -> BigDecimal.ONE;
                case "half_day" -> new BigDecimal("0.5");
                default -> BigDecimal.ZERO;
            };
            BigDecimal wage = w.getDailyWage().multiply(factor).setScale(2, RoundingMode.HALF_UP);
            BigDecimal otPay = ot.multiply(w.getDailyWage().divide(new BigDecimal("8"), 2, RoundingMode.HALF_UP));

            records.save(AttendanceRecord.builder()
                    .attendance(sheet).worker(w).status(status)
                    .wageEarned(wage).overtimeHours(ot).overtimePay(otPay).build());
        }
        return sheet;
    }

    // ---------- advances ----------
    @Transactional
    public WorkerAdvance addAdvance(UUID workerId, BigDecimal amount, LocalDate date, String reason) {
        Worker w = workers.findById(workerId).orElseThrow(() -> new RuntimeException("Worker not found"));
        WorkerAdvance a = advances.save(WorkerAdvance.builder()
                .worker(w).amount(amount).date(date != null ? date : LocalDate.now()).reason(reason)
                .recordedBy(currentUser()).status("pending_recovery")
                .recoveredAmount(BigDecimal.ZERO).build());
        w.setAdvanceBalance(w.getAdvanceBalance().add(amount));
        workers.save(w);
        return a;
    }

    public List<WorkerAdvance> advancesFor(UUID workerId) {
        return advances.findByWorkerIdOrderByDateDesc(workerId);
    }

    /** Recover (part of) an advance — reduces worker balance; recovered when fully paid back. */
    @Transactional
    public WorkerAdvance recover(UUID advanceId, BigDecimal amount) {
        WorkerAdvance a = advances.findById(advanceId).orElseThrow(() -> new RuntimeException("Advance not found"));
        BigDecimal recovered = (a.getRecoveredAmount() != null ? a.getRecoveredAmount() : BigDecimal.ZERO).add(amount);
        a.setRecoveredAmount(recovered);
        if (recovered.compareTo(a.getAmount()) >= 0) {
            a.setStatus("recovered");
            a.setRecoveredAt(Instant.now());
        }
        Worker w = a.getWorker();
        w.setAdvanceBalance(w.getAdvanceBalance().subtract(amount).max(BigDecimal.ZERO));
        workers.save(w);
        return advances.save(a);
    }

    /** Wage summary per worker over a date range — used by the wages tab. */
    public List<Map<String, Object>> wageSummary(UUID siteId, LocalDate from, LocalDate to) {
        return sheets.findBySiteIdAndDateBetweenOrderByDateDesc(siteId, from, to).stream()
                .flatMap(s -> records.findByAttendanceId(s.getId()).stream())
                .filter(r -> r.getWorker().getSite() != null && siteId.equals(r.getWorker().getSite().getId()))
                .collect(java.util.stream.Collectors.groupingBy(r -> r.getWorker().getId()))
                .entrySet().stream().map(e -> {
                    List<AttendanceRecord> rows = e.getValue();
                    Worker w = rows.get(0).getWorker();
                    BigDecimal wages = rows.stream()
                            .map(r -> (r.getWageEarned() != null ? r.getWageEarned() : BigDecimal.ZERO)
                                    .add(r.getOvertimePay() != null ? r.getOvertimePay() : BigDecimal.ZERO))
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    long present = rows.stream().filter(r -> "present".equals(r.getStatus())).count();
                    long half = rows.stream().filter(r -> "half_day".equals(r.getStatus())).count();
                    return Map.<String, Object>of(
                            "workerId", w.getId(), "workerName", w.getName(), "type", w.getType(),
                            "daysPresent", present, "halfDays", half,
                            "wages", wages, "advanceBalance", w.getAdvanceBalance());
                }).toList();
    }

    private User currentUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) throw new RuntimeException("User not found in context");
        return users.findByEmail(auth.getName()).orElseThrow();
    }
}
