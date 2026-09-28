# Risk Register

Shared across the Requirement, Estimation, and Audit pipelines. Risk is visible from
pre-sales through maintenance. Never reuse or renumber `RISK-###` IDs.

| ID | Risk | Likelihood | Impact | Mitigation | Owner | Status |
|----|------|-----------|--------|-----------|-------|--------|
| RISK-001 | Cross-tenant data leakage via shared connection pool or missing tenant filter | Medium | Critical | Schema-per-tenant resolver + tenant-isolation tests in dev phase | Dev | open |
| RISK-002 | Razorpay webhook failures leaving subscriptions in wrong state | Medium | High | Signature verification, idempotent handlers, reconciliation job | Dev | open |
| RISK-003 | Schema-per-tenant migration overhead (N schemas × Flyway runs) | Medium | Medium | Flyway migrate-on-provision + scheduled catch-up for existing tenants | Dev | open |
| RISK-004 | Subdomain routing breaks local dev (wildcard DNS) | High | Low | Use *.localhost/lvh.me + X-Tenant-ID header fallback (D-055) | Dev | mitigated |
| RISK-005 | Scope: porting full Spark feature set to backend is large | Medium | Medium | S1→S3 build slices; MoSCoW approved (D-064) | BA | mitigated |
| RISK-006 | Spring Boot 4.x + Java 25 upgrade breaking changes (Hibernate 7 multi-tenancy APIs, security config, jjwt/lombok versions) | Medium | Medium | Verify compatibility early in dev Phase 00; upgrade before tenancy code lands | Dev | open |
| RISK-007 | Razorpay one-time payments (no mandates) → renewal churn if reminders fail | Medium | Medium | D-7/D-3/D-1 reminders + grace period; reconciliation | Dev | open |
| RISK-008 | Grace read-only enforcement missed on some write endpoints → revenue leakage | Low | Medium | Central tenant-write guard interceptor; test coverage | Dev | open |
