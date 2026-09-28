# 03 — Backend Service Boundaries: Modular Monolith

[← Roadmap](../README.md) · Prev: [02 — Frontend Extraction](02-frontend-extraction.md)

## Purpose

Reorganize the single Spring Boot service from a technical-layer layout into a
**modular monolith by feature** — without splitting it into microservices, without
changing the database topology, and without breaking the tenant/context machinery.

## Non-negotiables

- **One backend binary**, one deployable. No Spring Cloud, no service mesh, no
  per-tenant backends — explicitly out of scope for this phase.
- Package root stays `com.elanjaibuildos.backend` so component scanning keeps working.
- `public` registry schema + `t_<slug>` tenant schemas; dual Flyway unchanged.
- The multitenancy/security cross-cutting code stays shared, not duplicated per feature.

## Current layout — observed

Under `../../backend/src/main/java/com/elanjaibuildos/backend/`:

| Package | Contents | Plane |
|---|---|---|
| `controller/` | 21 tenant-side controllers: `AgreementController`, `ApprovalController`, `AuthenticationController`, `ChangeRequestController`, `CollectionController`, `DashboardController`, `EstimatorController`, `ExpenseController`, `LaborController`, `MastersController`, `MaterialSpentController`, `NotificationController`, `PhotoController`, `ProjectMaterialController`, `QuotationController`, `ReportController`, `SettingController`, `SetupController`, `SiteController`, `SiteStageController`, `UserController` | tenant |
| `service/` | matching services incl. `AuthService`, `SiteAccessGuard`, `FileStorageService` | tenant |
| `model/`, `repository/`, `dto/` | tenant entities/repos/DTOs | tenant |
| `platform/controller/` | `AdminAuthController`, `AdminController`, `PlatformSupportController`, `PublicApiController`, `TenantBillingController`, `WebhookController` | platform + public |
| `platform/service/` | `AuditService`, `ExportService`, `InvoiceService`, `PlatformGuard`, `PlatformMailService`, `RazorpayService`, `SignupService`, `TenantLifecycleService`, `UsageService` | platform |
| `platform/model/` | `Invoice`, `Plan`, `PlatformAuditLog`, `PlatformSetting`, `PlatformUser`, `ProcessedWebhookEvent`, `SignupRequest`, `Subscription`, `Tenant`, `TenantNotification`, `UsageCounter` | platform (public schema) |
| `platform/repository/` | platform repos | platform |
| `security/` | `JwtAuthenticationFilter`, `JwtService`, `SecurityConfiguration` — dual-realm JWT | shared |
| `common/multitenancy/` | `TenantContext`, `TenantSchemaProvisioner`, `SchemaMultiTenantConnectionProvider`, `SchemaTenantIdentifierResolver`, `HibernateMultiTenancyConfig` | shared |
| `common/web/` | `TenantResolutionFilter`, `TenantLifecycleGuardFilter`, `GlobalExceptionHandler` | shared |
| `config/` | `ApplicationConfig`, `DataInitializer` | shared |

Key structural observation: `platform/` is already feature-grouped while the tenant
side is still flat by technical layer — the refactor mostly reorganizes the tenant side
and draws an explicit boundary around `identity`/`tenancy` shared by both planes.

## Target layout — recommended

```
com.elanjaibuildos.backend
├── platform/          # platform plane: Tenant, Plan, Subscription, Invoice,
│                      #   SignupRequest, PlatformUser, audit, webhooks, Razorpay
│   ├── web/  api/  service/  domain/  repository/
├── identity/          # authentication, users, invites, password reset
│   ├── web/  api/  service/  domain/  repository/
├── tenancy/           # tenant resolution, lifecycle guard, schema provisioning
│   ├── web/  service/  domain/          # thin — mostly delegates to common/*
├── projects/          # project wizard, setup
├── quotations/        # quotation builder, agreements, change requests
├── sites/             # sites, stages, photos, client portal
├── labor/             # labor, attendance
├── materials/         # materials, estimator, material spend, masters
├── billing/           # tenant-facing billing page data, usage counters
├── reports/           # dashboards, reports, exports
├── files/             # file storage, uploads
├── notifications/     # in-app + mail notifications
├── common/            # multitenancy/, web/ filters — unchanged, shared kernel
├── security/          # JWT dual-realm — unchanged
└── config/            # application config — unchanged
```

Per feature, use sub-packages `web` (controllers), `api` (request/response DTOs),
`service`, `domain` (entities/value objects), `repository` — mirroring the reference
backend's `api/domain/service/web` module style, adapted to our naming. Not every
feature needs all five; create a sub-package only when it has a member.

## Plane rules — recommended (the actual boundary)

| Plane | Entry points | Tenant context | Data |
|---|---|---|---|
| **public** | `PublicApiController` equivalents + future `identity` public endpoints (signup, verify, forgot/reset, `/login` redirect support) | none required; may accept a *hint* but never authorizes from it | `public` schema only |
| **tenant** | feature `web/` controllers under authenticated tenant realm | required — resolved by `TenantResolutionFilter` from `Host`, bound to a **tenant-realm** JWT (the realm+context enforcement is P0 net-new work, see [02-tenancy/01](../02-tenancy/01-identity-and-isolation.md)) | `t_<slug>` (+ `public` read for shared lookups via `search_path` tail) |
| **platform** | `platform.web` admin endpoints | none (platform realm); a `PlatformGuard`-style check already exists | `public` schema |

Rules:

1. Public-plane code must not require a tenant and must not authorize anything from a
   slug suffix, `?tenant=`, or `X-Tenant-ID`.
2. Tenant-plane code never touches another tenant's schema — enforced by
   `TenantContext` + `search_path`, verified by isolation tests
   ([04-quality/02](../04-quality/02-verification-matrix.md)).
3. Platform-plane code reaches tenant data only through explicit, audited operations
   (lifecycle actions, support tooling) — never by silently setting `TenantContext`.
4. Cross-feature calls go through the target feature's `service` API, not its
   `repository` — that is what makes this "modular" rather than just renamed packages.
   Deliberate, audited exceptions are allowed for platform→tenant controlled
   operations (provisioning, lifecycle actions, support tooling) — document each
   exception rather than bypassing the rule silently.

## Controller → feature mapping — recommended

| Feature | Controllers moved in | Notes |
|---|---|---|
| `identity` | `AuthenticationController`, `UserController` | tenant users/invites; platform auth stays in `platform` (`AdminAuthController`) |
| `tenancy` | `SetupController`, `SettingController` | workspace setup wizard + tenant settings; `MastersController` → `materials` or `tenancy` — decide by which domain owns masters data |
| `projects` | setup/project wizard portions of `SetupController` | split if `SetupController` covers both tenant setup and project wizard |
| `quotations` | `QuotationController`, `AgreementController`, `ChangeRequestController`, `ApprovalController` | quotation flow Draft→Finalized→Sent→Signed→Converted per BRs |
| `sites` | `SiteController`, `SiteStageController`, `PhotoController` | client portal endpoints live here too |
| `labor` | `LaborController` | attendance rules per BRs |
| `materials` | `MaterialSpentController`, `ProjectMaterialController`, `EstimatorController`, `MastersController` | estimator + masters if materials-owned |
| `billing` | `TenantBillingController` (platform pkg, tenant-facing), `CollectionController` | or move `CollectionController` to `reports`/finance — pick one home and document |
| `reports` | `DashboardController`, `ReportController` | |
| `files` | `FileStorageService` consumers, `PhotoController` upload endpoints if split | keep photo *metadata* in `sites` |
| `notifications` | `NotificationController` | |
| `platform` | existing `platform/*` | unchanged plane, add `api/` DTO sub-package |

## Phased tasks — Phase B (P1)

**B1. Mechanical moves, one feature at a time.**

- [ ] Create feature packages; move the smallest features first (`notifications`,
  `files`, `labor`) to establish the pattern; `identity` and `quotations` last.
- [ ] Move each controller with its service/model/repository/dto partners in the same
  commit so the diff is reviewable per feature.
- [ ] Keep `@SpringBootApplication` scan root at `com.elanjaibuildos.backend` — no
  config change needed while packages stay under it.
- [ ] No URL changes. Request mappings stay identical; this is internal structure only.

**B2. Enforce plane rules.**

- [ ] Package-dependency check (a package-import CI grep over `backend/src`, or an
  architecture-test tool only if the project deliberately adopts one — this roadmap
  assumes no new dependencies) so a tenant feature cannot import
  `platform.repository` internals and vice-versa.
- [ ] Public endpoints enumerated and annotated/documented — public plane is explicit,
  not "whatever has no auth annotation". Audit `SecurityConfiguration` permit-all
  rules as part of this.
- [ ] `TenantLifecycleGuardFilter` + `JwtAuthenticationFilter` keep the
  Phase-A-secured semantics (tenant realm + bound `TenantContext`, fail closed) —
  the reorg must not regress them to today's permissive `anyRequest().authenticated()`
  behavior.

**B3. Extract shared kernel boundaries.**

- [ ] `common/` and `security/` stay global; confirm no feature owns a copy.
- [ ] `tenancy` feature owns `TenantSchemaProvisioner` callers (provisioning lives in
  `platform`'s signup flow but the mechanism is shared kernel — document the split:
  `platform` decides *when* to provision, `common.multitenancy` knows *how*).

## Acceptance criteria

- [ ] App starts; schema management is unchanged (`spring.jpa.hibernate.ddl-auto=none`
  in `../../backend/src/main/resources/application.properties` — `validate`, which
  `../../requirement.md` prefers, is an optional explicit later target, not assumed
  here); all existing endpoints respond identically (URL, auth, payload) — verified
  by smoke/integration tests.
- [ ] Every tenant controller lives under a feature package; `controller/`,
  `service/`, `model/`, `repository/`, `dto/` top-level packages are empty/removed.
- [ ] Plane-dependency check runs in CI; public-plane endpoints enumerated.
- [ ] No new Spring beans exposed publicly; single binary still produced.

## Risks & dependencies

| Risk | Mitigation |
|---|---|
| Entity graphs cross feature boundaries (e.g. quotations referencing sites) making package moves circular | Move the owning entity with its feature; cross-feature references go through service APIs; where JPA entities must reference each other, keep them in the earlier feature and iterate |
| Massive single PR unreviewable | One feature per commit/PR; small features first |
| Hidden coupling via `dto/` shared across controllers | Map each DTO to its feature; split shared DTOs rather than creating a `shared-dto` dumping ground |
| Component-scan or Flyway path breakage | Scan root unchanged; Flyway paths are `resources/`, unaffected by package moves |
| Doing this in Phase A alongside frontend extraction | Backend reorg is P1/Phase B — keep Phase A diffs small |

## Dependencies

- Phase A frontend split (independent — backend URLs don't change, but sequencing it
  after A reduces in-flight churn).
- [02-tenancy/01](../02-tenancy/01-identity-and-isolation.md) security fixes can land
  before or during B — they touch `common/` + `identity`, not the feature layout.
