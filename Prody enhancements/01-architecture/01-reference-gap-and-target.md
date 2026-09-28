# 01 — Reference Gap Analysis and Target Architecture

[← Roadmap](../README.md) · Next: [02 — Frontend Extraction](02-frontend-extraction.md)

## Purpose

Record what the reference codebase (`elanjai-office-pro`) actually does — including the
ways it does **not** achieve independent deployment — compare it with the current
BuildOS codebase, and state the target architecture this roadmap implements.

## Sources examined

| Item | Value |
|---|---|
| Reference repo | `D:\elanjaitech\source\elanjai-office-pro` |
| Local HEAD examined | `6e53e00a3441cce1348cfa89cfe0a0fc76a897c4` |
| Remote `main` | `9556cc5e16dc2785ccd880d3e35b7e80dccfaea8` — 8 commits ahead of local HEAD, mostly admin-assisted onboarding and password-change work. Features on remote that were not reviewed locally must be re-verified before citing. |
| Current repo | this repository (`../../`) |

## Reference architecture — observed

The reference repo is a monorepo with **independent source trees**:

- `frontend-tenant/`, `frontend-landing/`, `frontend-admin/` — three separate SPA
  codebases.
- `backend/` — one Spring backend organized as **feature modules** (`api` / `domain` /
  `service` / `web` per feature), not by technical layer.
- `packages/api-tenant/`, `packages/api-platform/`, `packages/ui/` — shared typed
  clients and UI primitives consumed by the frontends.
- PostgreSQL with a `public` registry schema plus one schema per tenant.
- `TenantUsernames` — sign-in identity of the form `<local>@<tenantCode>` where
  `tenantCode` **is** the tenant slug: `TenantRegistryService` (~lines 17–24) states
  the slug is the tenant code — canonical 3–10 chars, schemas named `tenant_<code>` —
  and the code is distinct from the internal tenant id. BuildOS equivalents differ:
  slug 3–30 chars, schema `t_<slug>`.
- `TenantResolver` — resolves the tenant from host/hint and **authorizes** by checking
  membership in the `public` schema (a user may hold memberships in multiple tenants).
- `ProvisionTenantOperation` + `DurableOperationRunner` — durable, resumable
  provisioning steps persisted so a crashed provision can be resumed/compensated.
- Dual Flyway tracks (public + per-tenant) and a **separate admin edge**.

### The deployment gap — read this before copying anything

**Source separation is not deployment independence.** In the reference repo:

- `docker/tenant-edge.Dockerfile` and `docker-compose.yml` build **one** image
  (`elanjai-office`) that bundles the landing SPA at `/` **and** the tenant SPA at
  `/app`. The admin app ships through a separate edge.
- Release/promotion treats `app`, `admin`, `backend`, `db` as deployable units, so a
  landing-only content edit redeploys the combined `app` image — the tenant app is
  rebuilt and restarted along with it.

Do **not** treat the reference landing frontend as independently deployable, and do not
reproduce its `/app` path bundling. BuildOS's target keeps tenant routes on the tenant
host root — see [03-deployment/01](../03-deployment/01-independent-delivery.md).

## Current BuildOS state — observed

| Concern | Current implementation | File(s) |
|---|---|---|
| Frontend | **One** SPA; `main.tsx` mounts `SaasApp.tsx`, which host-switches between admin routes (`/admin/login`, `/admin/*`) and the combined public+tenant route tree | `../../src/main.tsx`, `../../src/SaasApp.tsx` |
| Public + tenant pages | Marketing (landing, pricing), signup, verify-email, pending, workspace-not-found, accept-invite, forgot/reset-password live in `pages.tsx`; tenant billing and the tenant shell are separate sibling files | `../../src/saas/pages.tsx`, `../../src/saas/TenantBilling.tsx`, `../../src/saas/TenantShell.tsx` |
| Admin console | `AdminConsole.tsx` + admin login inside the same bundle | `../../src/saas/AdminConsole.tsx` |
| Tenant app | MVP feature tree mounted under `TenantShell` at `/*` | `../../src/AppMVP.tsx`, `../../src/components/mvp/`, `../../src/components/` |
| API client | Single axios instance; `jwt_token` in `localStorage`; `X-Tenant-ID` dev header from `currentTenantSlug()` | `../../src/lib/api.ts` |
| Tenant detection (client) | `<slug>.<base>` host, else `?tenant=` param, else `localStorage tenant_slug`; admin via host match or `localStorage admin_console=1` | `../../src/lib/tenant.ts` |
| Frontend packaging | Single `Dockerfile.frontend` (context = repo root, `COPY . .`), single `nginx.conf` (SPA fallback + `/api/` proxy), single `frontend` compose service | `../../Dockerfile.frontend`, `../../nginx.conf`, `../../docker-compose.yml` |
| Backend | One Spring Boot service; tenant-side flat `controller/`/`service/`/`model/`/`repository/`/`dto/`; platform-side `platform/{controller,model,repository,service}`; cross-cutting `security/`, `common/multitenancy/`, `common/web/`, `config/` | `../../backend/src/main/java/com/elanjaibuildos/backend/` |
| Tenancy | `TenantResolutionFilter` (raw `Host`, or `X-Tenant-ID` dev header — `TENANT_DEV_HEADER` currently defaults `true` in `application.properties`) → `TenantContext`; `JwtAuthenticationFilter` rejects a tenant token whose tenant claim mismatches the resolved tenant; `SchemaMultiTenantConnectionProvider` sets `search_path` to `tenant, public` and resets on release; `SchemaTenantIdentifierResolver`; `HibernateMultiTenancyConfig` | `../../backend/src/main/java/com/elanjaibuildos/backend/common/web/TenantResolutionFilter.java`, `../../backend/src/main/java/com/elanjaibuildos/backend/common/multitenancy/` |
| Authorization gap | `SecurityConfiguration` guards `/api/admin/**` by role and everything else by `anyRequest().authenticated()`; `JwtAuthenticationFilter` authenticates a platform JWT even on tenant paths, so a platform token may reach tenant endpoints without a bound `TenantContext`. **Not closed today** — explicit P0 enforcement in [02-tenancy/01](../02-tenancy/01-identity-and-isolation.md) | `../../backend/src/main/java/com/elanjaibuildos/backend/security/SecurityConfiguration.java`, `../../backend/src/main/java/com/elanjaibuildos/backend/security/JwtAuthenticationFilter.java` |
| Provisioning | `SignupService.approve` → `TenantSchemaProvisioner` (`CREATE SCHEMA t_<slug>` + tenant Flyway) → owner user → 14-day trial | `../../backend/src/main/java/com/elanjaibuildos/backend/platform/service/SignupService.java`, `../../backend/src/main/java/com/elanjaibuildos/backend/common/multitenancy/TenantSchemaProvisioner.java` |
| Migrations | Dual Flyway: `db/migration` (public), `db/migration-tenant` (per schema) | `../../backend/src/main/resources/db/migration/`, `../../backend/src/main/resources/db/migration-tenant/` |
| Tests | **No `backend/src/test/java` detected** — all backend test coverage is net-new | — |

## Target architecture — recommended

```
repo root
├── frontend-landing/      → image `buildos-landing`   (apex + www)
├── frontend-admin/        → image `buildos-admin`     (admin.<base>)
├── frontend-tenant/       → image `buildos-tenant`    (<slug>.<base>)
├── packages/
│   ├── ui/                → optional; extract only when ≥2 apps share components
│   ├── api-public/        → optional typed client for unauthenticated endpoints
│   ├── api-platform/      → optional typed client for admin endpoints
│   └── api-tenant/        → optional typed client for tenant endpoints
├── backend/               → ONE binary; modular monolith by feature
└── docker-compose.yml     → postgres + backend + 3 frontends + gateway + mailpit
```

- **Hosts**: apex `buildos.example` / `www` → landing; `admin.<base>` → admin;
  `<slug>.<base>` wildcard → tenant. A central gateway does host-based routing to
  independently built images. There is **no** `/app` path prefix for the tenant app.
- **API**: every app calls same-origin `/api`; each hop preserves the canonical
  external `Host` header (`proxy_set_header Host $host`) because the backend resolves
  tenants from raw `Host`, and the edge strips client-supplied `X-Forwarded-*` and
  tenant headers. Details in [03-deployment/01](../03-deployment/01-independent-delivery.md).
- **Backend**: one binary; feature packages (`platform`, `identity`, `tenancy`,
  `projects`, `quotations`, `sites`, `labor`, `materials`, `billing`, `reports`,
  `files`) with `web`/`api`/`service`/`domain`/`repository` per feature — see
  [03-backend-service-boundaries](03-backend-service-boundaries.md).
- **Data**: unchanged — `public` registry + `t_<slug>` per tenant; dual Flyway.

## Gap table

| Capability | Reference (`elanjai-office-pro`) | Current BuildOS | Target BuildOS |
|---|---|---|---|
| Frontend source separation | ✅ 3 trees | ❌ 1 bundle | ✅ 3 trees (Phase A) |
| Frontend **independent deployment** | ❌ landing+tenant bundled in one image | ❌ 1 image | ✅ per-app images + gateway (Phase A) |
| Typed API packages | ✅ `packages/api-*` | ❌ ad-hoc axios | ⏳ only when duplication warrants (P1) |
| Shared UI package | ✅ `packages/ui` | ❌ | ⏳ trigger-based (P1) |
| Backend feature modules | ✅ api/domain/service/web | ❌ layered + platform pkg | ✅ modular monolith (Phase B) |
| Username `<local>@<tenant>` | ✅ `TenantUsernames` | ❌ email+host only | ✅ `<local>@<slug>` canonical for new users; email+host retained during transition (Phase B) |
| Public-schema membership authz | ✅ multi-membership | ❌ token↔tenant match | ❌ not required — single membership per schema is enough for BRs |
| Durable provisioning runner | ✅ `DurableOperationRunner` | ❌ synchronous `approve` | ⏳ adopt only if justified (P1) |
| Dual Flyway | ✅ | ✅ | ✅ keep |
| Separate admin edge | ✅ | ❌ (host-switch in one app) | ✅ `admin.<base>` → admin image |
| Backend tests | — | ❌ none detected | ✅ isolation + integration tests (P0) |

## Adopt vs deliberately do not adopt

**Adopt (as patterns, adapted to BuildOS identifiers):**

1. Three frontend source trees with per-app build/runtime artifacts.
2. Feature-module backend organization (naming adapted to `com.elanjaibuildos.backend.<feature>`).
3. `<local>@<tenant>` canonical sign-in — suffixed with the tenant slug, same pattern
   as the reference, but using BuildOS's slug rules (3–30 chars) and `t_<slug>` schema
   naming rather than the reference's 3–10 length and `tenant_<code>` prefix.
4. Durable-operation pattern for provisioning — only if basic idempotent steps prove
   insufficient (see [02-tenancy/02](../02-tenancy/02-provisioning-and-migrations.md)).
5. Public-schema operation/state tables where cross-tenant state is genuinely needed.

**Do not adopt:**

1. The bundled `elanjai-office` edge image or `/app` tenant path — it is exactly the
   deployment coupling this roadmap removes.
2. The reference's 3–10-char slug length, `tenant_<code>` schema naming, and its
   public-schema multi-membership model — BuildOS keeps its own slug rules
   (3–30, `t_<slug>`) and per-schema users (BR-001); no membership directory is added.
3. Any reference domain features (finance/HR/etc.) — out of scope for BuildOS.
4. Remote-HEAD features not present at the examined commit without re-verification.

## Risks & dependencies

| Risk | Mitigation |
|---|---|
| Treating reference source-split as proof of deployability and replicating the bundled edge | This doc's gap section is the contract; [03-deployment/01](../03-deployment/01-independent-delivery.md) defines per-app images |
| Reference repo drifts (remote 8 commits ahead) | Pin citations to `6e53e00…`; re-verify before referencing newer features |
| Extraction stalls mid-way leaving two frontend structures | Phase A keeps the existing `src/` bundle deployable until cutover — see [02-frontend-extraction](02-frontend-extraction.md#rollback) |
| Scope creep into reference domain features | "Do not adopt" list above is normative |
