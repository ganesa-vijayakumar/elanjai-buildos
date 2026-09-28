# Phase Context — ElanjaiBuildos Multi-Tenant Conversion

## Execution Context
- **Build mode:** incremental (existing codebase converted in place)
- **Profile:** full (phases 00–14) · review.mode=manual
- **Stack target:** React 19+Vite 7+TS+Tailwind4+Radix / Spring Boot 4.x + Java 25 / PostgreSQL 16 schema-per-tenant / Docker Compose dev
- **Capability resolution:** READY, core-only scope (no optional modules selected)
- **Coverage target:** 80% · Lighthouse: 90 · api.contract.first: true

## Baseline Inventory (existing code)
- `backend/` — Maven, Spring Boot 3.2.3, Java 17, JPA, spring-security, jjwt 0.11.5, MySQL connector, `ddl-auto=update`. Packages: config, controller, dto, model, repository, security, service. Entities: User, Site, Quotation, Collection, Expense, MaterialSpent, Setting, ConstructionStage (+enums). No tests, no Flyway.
- `src/` — React frontend. `main.tsx` → `AppMVP.tsx` (live, backend-backed: login/dashboards/sites/quotations/reports/settings). `src/App.tsx` legacy full-feature Spark/useKV version (to remove after port — D-058). `src/lib/api.ts` axios client (hardcoded baseURL, jwt_token localStorage, 401→/login). `src/hooks/useAuth.ts`.
- `resources/` — PRD.md, saas-subscription-business-plan.md
- No CI, no tests, no docker-compose. Secrets in `application.properties` (jwt secret, mysql creds) → to be env-ified.

## Conventions (observed)
- Backend: Lombok entities/DTOs, constructor injection, enum-driven statuses, `@RestController` + service/repository layering
- Frontend: functional components, hooks, Tailwind classes, shadcn-style UI components under `src/components/ui`

## Preflight Report → GO
- requirement.md: complete (roles + entities + screens + rules); no placeholders
- Shape web: BASELINE_SUPPORTED · verdict READY
- Approved scope: REQ-001..055 per `_ledger/requirements.json`; MVP slices S1→S3
- Risks: RISK-001..008 (isolation tests, webhook idempotency, N×Flyway, Boot4 upgrade)
- GO — proceed to Phase 01 planning.
