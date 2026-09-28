package com.elanjaibuildos.backend.common.web;

import com.elanjaibuildos.backend.platform.service.PlatformGuard;
import com.elanjaibuildos.backend.platform.service.SignupService;
import com.elanjaibuildos.backend.platform.service.UsageService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;
import java.util.NoSuchElementException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(UsageService.PlanLimitExceeded.class)
    public ResponseEntity<Map<String, Object>> planLimit(UsageService.PlanLimitExceeded e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "error", "PLAN_LIMIT",
                "metric", e.metric, "used", e.used, "limit", e.limit,
                "message", e.getMessage()));
    }

    @ExceptionHandler(PlatformGuard.FeatureLocked.class)
    public ResponseEntity<Map<String, Object>> featureLocked(PlatformGuard.FeatureLocked e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "error", "FEATURE_LOCKED", "feature", e.feature, "message", e.getMessage()));
    }

    @ExceptionHandler(SignupService.SignupException.class)
    public ResponseEntity<Map<String, String>> signup(SignupService.SignupException e) {
        return ResponseEntity.badRequest().body(Map.of("error", "BAD_REQUEST", "message", e.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> badRequest(IllegalArgumentException e) {
        return ResponseEntity.badRequest()
                .body(Map.of("error", "BAD_REQUEST", "message", e.getMessage()));
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<Map<String, String>> notFound(NoSuchElementException e) {
        return ResponseEntity.status(404).body(Map.of("error", "NOT_FOUND", "message", "Not found."));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> validation(MethodArgumentNotValidException e) {
        String msg = e.getBindingResult().getFieldErrors().stream()
                .map(f -> f.getField() + ": " + f.getDefaultMessage())
                .findFirst().orElse("Validation failed");
        return ResponseEntity.badRequest().body(Map.of("error", "VALIDATION", "message", msg));
    }
}
