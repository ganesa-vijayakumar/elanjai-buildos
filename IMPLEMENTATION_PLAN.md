# Implementation Plan — Multi-Tenant Conversion (Phase 01)

Source of truth: `requirement.md` + `_ledger/requirements.json` (REQ-001..055), `design/` + `_ledger/design-system.json`. Build slices S1→S3 (D-064).

## S1 — Platform Foundation

### S1a Stack upgrade & infra
- `backend/pom.xml`: Spring Boot **4.1.1** parent, `java.version=25`, replace mysql-connector → `org.postgresql:postgresql`, add `flyway-core` + `flyway-database-postgresql`, `spring-boot-starter-mail`, `openhtmltopdf-pdfbox`, bump jjwt → 0.12.x, lombok → 1.18.48+.
- `application.properties` → env-driven (`${ENV:default}`): Postgres URL, JWT secret, Razorpay keys, SMTP, storage root, base domain.
- `docker-compose.yml`: postgres:16 + backend (eclipse-temurin:25-jdk build) + frontend (node build) + mailpit + `app-data` volume.
- `backend/Dockerfile` (temurin-25), `Dockerfile.frontend` (node:24 build → nginx or vite preview).

### S1b Tenancy plumbing
- `common/multitenancy/`: `TenantContext` (slug), `TenantSchemaContext`, `SchemaTenantIdentifierResolver`, `SchemaMultiTenantConnectionProvider` (search_path `t_<slug>, public`), `HibernateMultiTenancyConfig`, `TenantContextGuardFilter`.
- `TenantResolutionFilter`: Host → slug (`{slug}.{base-domain}`, `*.localhost` dev) → tenant lookup (status check) → set context; dev fallbacks `X-Tenant-ID`, `?tenant=`. Clear in finally.
- Flyway: `db/migration/V1__public.sql` (10 platform tables + plan seed) · `db/migration-tenant/V1__tenant.sql` (26 tenant tables) · `V2__seed_masters.sql` (stage template, packages, materials, brands, extra works).
- `ddl-auto=none` (D-067).

### S1c Auth realms + onboarding + lifecycle
- `JwtService` two realms: `platform` (public.users) vs `tenant` (tenant_id + user id + role claims). Host↔JWT cross-check → 403.
- `SignupController` (public): signup, slug-availability, email verify.
- `AdminAuthController` (platform login).
- `ProvisioningService`: approve → schema create → tenant flyway → seed → owner user → TRIAL.
- `LifecycleService` (@Scheduled): trial expiry→grace, grace→suspend, cancel→offboard→delete(+30d), renewal reminders.
- `TenantWriteGuardFilter`: GRACE tenant → mutating verbs → 403.

### S1d Admin console + metering
- Controllers: `/api/admin/auth`, `/tenants` (list/detail/suspend/reactivate/offboard), `/approvals`, `/plans`, `/billing` (subs+invoices+MRR), `/settings`, `/audit`.
- `UsageService` (counters) + interceptor incrementing api_calls_day; enforcement on create endpoints (projects, staff, quotations, storage) → `PLAN_LIMIT`; `FEATURE_LOCKED` for gated features.

### S1e Billing
- Razorpay REST: order/payment-link create, webhook `/api/public/razorpay/webhook` (HMAC verify, idempotent via processed_events), invoice rows + OpenHTMLtoPDF GST PDF to volume.
- ExportService: tenant CSV+files ZIP on offboard.

### S1f Frontend skeleton
- Add `react-router-dom`; `api.ts` → env baseURL + tenant-aware (sends JWT; dev `?tenant=`); route table per realm (public/admin/tenant); new pages landing/signup/pending/login/admin-login/paywall; admin console shell (sidebar) + tenant shell (topnav); design tokens → Tailwind theme (slate/indigo, tenant accent var).

## S2 — Tenant Core
Port to backend-backed, tenant-scoped: users+invites, dashboards, quotations (+normalized details) + agreement, project wizard + stages, expenses (approval) + collections, settings masters, materials spent, site photos, billing page, setup wizard.

## S3 — Extended
Labor (workers/attendance/advances/payment summaries), material estimator, project_materials tracking, reports+CSV, client portal + change requests, notifications, branding runtime. Then remove `App.tsx` (D-058).

## Verification (Phase 05/07/09/10)
- `mvn -q compile` in Docker (temurin-25) · frontend `npm run build`+lint
- Tenant-isolation tests: seed 2 tenants, assert cross-tenant reads/writes rejected
- E2E: signup→approve→trial→login→quota enforcement→paywall states
- `docker compose up` smoke: postgres, backend /health, frontend, mailpit

## New dependencies (all stable, ≥7d old)
`postgresql` · `flyway-core` + `flyway-database-postgresql` · `spring-boot-starter-mail` · `com.openhtmltopdf:openhtmltopdf-pdfbox` · `io.jsonwebtoken:jjwt-*@0.12.x` · `react-router-dom@7` · (Razorpay via REST, no SDK)
