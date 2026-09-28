package com.elanjaibuildos.backend.platform.web;

import com.elanjaibuildos.backend.platform.domain.Plan;
import com.elanjaibuildos.backend.platform.domain.SignupRequest;
import com.elanjaibuildos.backend.platform.repository.PlanRepository;
import com.elanjaibuildos.backend.platform.service.SignupService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Unauthenticated public realm: plans, signup, email verification, slug check. */
@RestController
@RequestMapping("/api/public")
public class PublicApiController {

    private final SignupService signupService;
    private final PlanRepository plans;

    public PublicApiController(SignupService signupService, PlanRepository plans) {
        this.signupService = signupService;
        this.plans = plans;
    }

    @GetMapping("/plans")
    public List<Plan> plans() {
        return plans.findByIsActiveTrueOrderBySortOrder();
    }

    public record SignupBody(
            @NotBlank @Size(max = 160) String companyName,
            @NotBlank @Size(max = 160) String ownerName,
            @NotBlank @Email String email,
            @Size(max = 30) String phone,
            @NotBlank @Size(min = 8, max = 100) String password,
            @NotBlank String slug,
            String gstin, String state,
            @NotBlank String planCode,
            String billingCycle) {}

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@Valid @RequestBody SignupBody b) {
        SignupRequest req = signupService.signup(
                b.companyName(), b.ownerName(), b.email(), b.phone(), b.password(),
                b.slug().toLowerCase(), b.gstin(), b.state(), b.planCode(), b.billingCycle());
        return ResponseEntity.accepted().body(Map.of(
                "status", "pending",
                "message", "Check your email to verify your signup.",
                "slug", req.getSlug()));
    }

    @GetMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestParam String token) {
        signupService.verifyEmail(token);
        return ResponseEntity.ok(Map.of("status", "verified"));
    }

    @GetMapping("/slug-available")
    public Map<String, Boolean> slugAvailable(@RequestParam String slug) {
        return Map.of("available", signupService.slugAvailable(slug.toLowerCase()));
    }
}
