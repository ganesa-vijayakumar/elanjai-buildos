package com.elanjaibuildos.backend.service;

import com.elanjaibuildos.backend.dto.QuotationRequest;
import com.elanjaibuildos.backend.dto.QuotationResponse;
import com.elanjaibuildos.backend.model.Quotation;
import com.elanjaibuildos.backend.model.QuotationStatus;
import com.elanjaibuildos.backend.model.Site;
import com.elanjaibuildos.backend.model.SiteStatus;
import com.elanjaibuildos.backend.model.User;
import com.elanjaibuildos.backend.repository.QuotationRepository;
import com.elanjaibuildos.backend.repository.SiteRepository;
import com.elanjaibuildos.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuotationService {

    private final QuotationRepository quotationRepository;
    private final SiteRepository siteRepository;
    private final UserRepository userRepository;
    private final com.elanjaibuildos.backend.platform.service.PlatformGuard platformGuard;
    private final StageService stageService;

    public List<QuotationResponse> getAllQuotations() {
        return quotationRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public QuotationResponse getQuotationById(UUID id) {
        return quotationRepository.findById(id)
                .map(this::mapToResponse)
                .orElseThrow(() -> new RuntimeException("Quotation not found"));
    }

    public QuotationResponse createQuotation(QuotationRequest request) {
        platformGuard.checkAndIncrement(com.elanjaibuildos.backend.platform.model.UsageCounter.M_QUOTATIONS_MONTH);
        User currentUser = getCurrentUser();

        Quotation quotation = Quotation.builder()
                .quotationNumber(generateQuotationNumber())
                .clientName(request.getClientName())
                .clientPhone(request.getClientPhone())
                .clientEmail(request.getClientEmail())
                .location(request.getLocation())
                .builtupArea(request.getBuiltupArea())
                .ratePerSqft(request.getRatePerSqft())
                .packageName(request.getPackageName())
                .totalValue(request.getTotalValue())
                .stageBreakdown(request.getStageBreakdown())
                .status(QuotationStatus.DRAFT) // Default to DRAFT
                .createdBy(currentUser)
                .build();

        return mapToResponse(quotationRepository.save(quotation));
    }

    public QuotationResponse updateQuotation(UUID id, QuotationRequest request) {
        Quotation quotation = quotationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Quotation not found"));

        quotation.setClientName(request.getClientName());
        quotation.setClientPhone(request.getClientPhone());
        quotation.setClientEmail(request.getClientEmail());
        quotation.setLocation(request.getLocation());
        quotation.setBuiltupArea(request.getBuiltupArea());
        quotation.setRatePerSqft(request.getRatePerSqft());
        quotation.setPackageName(request.getPackageName());
        quotation.setTotalValue(request.getTotalValue());
        quotation.setStageBreakdown(request.getStageBreakdown());
        if (request.getStatus() != null) {
            quotation.setStatus(request.getStatus());
        }

        return mapToResponse(quotationRepository.save(quotation));
    }

    @Transactional
    public QuotationResponse convertToSite(UUID id) {
        Quotation quotation = quotationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Quotation not found"));

        if (quotation.getStatus() == QuotationStatus.CONVERTED) {
            throw new RuntimeException("Quotation already converted");
        }

        User currentUser = getCurrentUser();

        // Create Site from Quotation
        Site site = Site.builder()
                .siteName(quotation.getClientName() + " - " + quotation.getLocation())
                .clientName(quotation.getClientName())
                .clientPhone(quotation.getClientPhone())
                .clientEmail(quotation.getClientEmail())
                .location(quotation.getLocation())
                .builtupArea(quotation.getBuiltupArea())
                .ratePerSqft(quotation.getRatePerSqft())
                .packageName(quotation.getPackageName())
                .totalValue(quotation.getTotalValue())
                .status(SiteStatus.IN_PROGRESS)
                .startDate(LocalDate.now())
                // expectedEndDate typically calculated, leave null or set default duration
                .createdBy(currentUser)
                .build();

        Site savedSite = siteRepository.save(site);
        // Prefer the quotation's own stage split; fall back to tenant templates
        if (stageService.copyBreakdownToSite(savedSite, quotation.getStageBreakdown()) == 0) {
            stageService.copyTemplateToSite(savedSite);
        }
        // currentStage = first stage of the copied set
        stageService.forSite(savedSite.getId()).stream().findFirst()
                .ifPresent(s -> { savedSite.setCurrentStage(s.getName()); siteRepository.save(savedSite); });

        // Update Quotation
        quotation.setStatus(QuotationStatus.CONVERTED);
        quotation.setConvertedSite(savedSite);
        Quotation savedQuotation = quotationRepository.save(quotation);

        return mapToResponse(savedQuotation);
    }

    public void deleteQuotation(UUID id) {
        quotationRepository.deleteById(id);
    }

    private String generateQuotationNumber() {
        YearMonth currentMonth = YearMonth.now();
        LocalDateTime queryDate = currentMonth.atDay(1).atStartOfDay();
        long count = quotationRepository.countByCreatedAtAfter(queryDate);
        String sequence = String.format("%04d", count + 1);
        return "QT-" + currentMonth.format(DateTimeFormatter.ofPattern("yyyyMM")) + "-" + sequence;
    }

    private User getCurrentUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) throw new RuntimeException("User not found in context");
        return userRepository.findByEmail(auth.getName()).orElseThrow();
    }

    private QuotationResponse mapToResponse(Quotation quotation) {
        return QuotationResponse.builder()
                .id(quotation.getId())
                .quotationNumber(quotation.getQuotationNumber())
                .clientName(quotation.getClientName())
                .clientPhone(quotation.getClientPhone())
                .clientEmail(quotation.getClientEmail())
                .location(quotation.getLocation())
                .builtupArea(quotation.getBuiltupArea())
                .ratePerSqft(quotation.getRatePerSqft())
                .packageName(quotation.getPackageName())
                .totalValue(quotation.getTotalValue())
                .stageBreakdown(quotation.getStageBreakdown())
                .status(quotation.getStatus())
                .convertedSiteId(quotation.getConvertedSite() != null ? quotation.getConvertedSite().getId() : null)
                .createdBy(quotation.getCreatedBy() != null ? quotation.getCreatedBy().getId() : null)
                .createdAt(quotation.getCreatedAt())
                .build();
    }
}
