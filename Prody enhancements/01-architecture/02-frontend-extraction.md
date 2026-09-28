# 02 — Frontend Extraction: One SPA → Three Apps

[← Roadmap](../README.md) · Prev: [01 — Reference Gap](01-reference-gap-and-target.md) · Next: [03 — Backend Boundaries](03-backend-service-boundaries.md)

## Purpose

Extract the single React bundle into `frontend-landing/`, `frontend-admin/`, and
`frontend-tenant/` — three independent install/build/deploy artifacts — while keeping
the monorepo and leaving the existing bundle deployable until gateway cutover.

## Current state — observed

`../../src/main.tsx` mounts `../../src/SaasApp.tsx`, which picks a route tree by host
(`isAdminHost()` from `../../src/lib/tenant.ts`):

| Host branch | Routes (observed in `SaasApp.tsx`) |
|---|---|
| Admin host | `/admin/login` → `AdminLogin`; `/admin/*` → `AdminConsole`; `*` → `/admin` |
| All other hosts | `/` `Landing`, `/pricing` `Pricing`, `/signup` `Signup`, `/verify-email` `VerifyEmail`, `/pending` `PendingApproval`, `/workspace-not-found` `WorkspaceNotFound`, `/accept-invite` `AcceptInvite`, `/forgot-password` `ForgotPassword`, `/reset-password` `ResetPassword`, `/billing` → `TenantBilling`, `/*` → `TenantShell` + `AppMVP` |

Supporting files to split:

| File | Contents | Destination |
|---|---|---|
| `../../src/saas/pages.tsx` | Landing, Pricing, Signup, VerifyEmail, PendingApproval, WorkspaceNotFound, AcceptInvite, ForgotPassword, ResetPassword — marketing **and** tenant-auth pages mixed in one module | split: marketing → `frontend-landing`; auth/workspace → `frontend-tenant` |
| `../../src/saas/AdminConsole.tsx`, `AdminLogin` | platform admin UI | `frontend-admin` |
| `../../src/saas/TenantBilling.tsx`, `../../src/saas/TenantShell.tsx` | tenant chrome + billing page | `frontend-tenant` |
| `../../src/AppMVP.tsx`, `../../src/components/mvp/` | tenant feature app incl. `components/mvp/LoginPage.tsx` — the tenant `/login` screen, mounted inside `AppMVP` (it is **not** in `saas/pages.tsx`) | `frontend-tenant` |
| `../../src/components/ui/`, `../../src/lib/utils.ts`, `../../src/lib/toast.ts`, Tailwind/shadcn setup (`../../components.json`, `../../tailwind.config.js`, `../../theme.json`, `../../src/index.css`, `../../src/main.css`, `../../src/styles/`) | shared primitives | copy per app initially; promote to `packages/ui` only when duplication is real (see [04-quality/01](../04-quality/01-reusable-enhancements.md)) |
| `../../src/lib/api.ts` | axios instance: `baseURL = VITE_API_BASE_URL`; `jwt_token` localStorage; `X-Tenant-ID` dev header; clears `jwt_token`/`user_data` on 401 | one copy per app, renamed per-realm (see token isolation) |
| `../../src/lib/tenant.ts` | `isAdminHost()`, `currentTenantSlug()` (host → `?tenant=` → `localStorage tenant_slug`), `setTenantOverride()`, `tenantUrl(slug)` | tenant app keeps slug helpers minus `admin_console`; landing needs only `tenantUrl`; admin needs none |
| `../../src/lib/types.ts`, `database.types.ts`, `calculations.ts`, `materialData.ts`, `mockData.ts`, `siteMapper.ts` | tenant-domain types/logic | `frontend-tenant` (audit first — keep only what the tenant app uses) |
| `../../Dockerfile.frontend`, `../../nginx.conf` | single image; SPA fallback + `/api/` → `backend:8080` | replaced by per-app Dockerfile + nginx |
| `../../docker-compose.yml` `frontend` service | port `5173:5173` | replaced by three services + gateway (see [03-deployment/01](../03-deployment/01-independent-delivery.md)) |
| `../../index.html`, `../../vite.config.ts`, `../../package.json`, `../../tsconfig.json` | root SPA scaffold | becomes per-app scaffold; root copies removed after cutover |

## Target route ownership — recommended

| App | Host | Owns |
|---|---|---|
| `frontend-landing` | `buildos.example`, `www.buildos.example` | `/`, `/pricing`, `/signup`, `/verify-email`, `/pending`, `/login` (generic entry — below) |
| `frontend-tenant` | `<slug>.<base>` | `/login`, `/forgot-password`, `/reset-password`, `/accept-invite`, `/billing`, `/workspace-not-found`, all workspace/dashboard routes (current `/*` → `TenantShell`+`AppMVP`) |
| `frontend-admin` | `admin.<base>` | `/admin/login`, `/admin/*` |

Routing notes:

- `/verify-email` and `/pending` belong to the **signup/public** flow → landing. Confirm
  the backend email links point at the apex; update link generation when implementing.
- `/workspace-not-found` is served by the tenant app — an unknown `<slug>` host still
  reaches the tenant image via wildcard DNS/gateway, but **routing alone cannot decide
  a workspace is missing**: the app must call a public workspace-status endpoint
  (e.g. `GET /api/public/tenants/{slug}/status` on the `PublicApiController` surface —
  add it if absent, returning only existence + lifecycle-safe status, never user data)
  and render not-found for unknown/inaccessible slugs.
- `/billing` stays on the tenant host (it is in-app billing for tenant admins). The
  platform's tenant-management billing lives under `/admin/*` in the admin app.

### Apex `/login` — generic workspace entry (recommended)

A public "Log in" on the apex cannot know the tenant. Implement `/login` on the
**landing** app as a *directory* page, not an auth page:

1. User enters an explicit workspace name (`acme`) or a canonical username
   (`sanjay@acme`).
2. Parse a `@`-suffix only when the input is valid **username** syntax whose suffix is
   a canonical slug — do **not** treat just any `user@domain` email string as a
   workspace hint. Validate the slug against `^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$`
   (the same rule `SignupService` applies), then navigate to
   `https://<slug>.<base>/login` via a client-side location change. Carry nothing in
   the query string — no email/username prefill, and never invite/reset tokens.
   (A server-side 302 is only an option if the gateway implements one; the SPA alone
   does a `window.location` navigation.)
3. If only a bare email or anything unrecognized is entered, show "enter your
   workspace" — do **not** attempt central authentication and do **not** probe for an
   email→tenant mapping (no central email→tenant directory exists; email is only
   unique per tenant schema, BR-001).
4. Never set `localStorage admin_console=1` or any tenant override from the apex. The
   current `admin_console` escape hatch in `../../src/lib/tenant.ts` is dev-only and
   must not ship as a production path.

The backend does not need a new endpoint for this page; it is client-side navigation
between hosts. If a "find my workspace" email flow is wanted later, it belongs to
Phase B and sends mail rather than disclosing tenant existence.

## Token and client isolation — recommended

Today one `jwt_token` key is shared across realms because one origin serves both
(`../../src/lib/api.ts`). After the split, origins differ, so browser storage is
naturally isolated — make it explicit anyway:

| App | Storage key | Realm |
|---|---|---|
| tenant | `buildos.tenant.token` + `buildos.tenant.user` | tenant JWT (`JwtAuthenticationFilter` tenant realm) |
| admin | `buildos.admin.token` + `buildos.admin.user` | platform JWT |
| landing | none — no authenticated calls | public endpoints only |

- Each app's `api` client attaches only its own token. The admin client never sends
  `X-Tenant-ID`; the tenant client sends it only in dev (see below).
- **Dev overrides** (`?tenant=`, `localStorage tenant_slug`/`admin_console`,
  `X-Tenant-ID`) stay gated behind `VITE_*` dev flags and the backend's
  `TENANT_DEV_HEADER` — which currently defaults `true` in
  `../../backend/src/main/resources/application.properties`, so Phase A must make it
  default-off / fail closed outside dev compose. See
  [02-tenancy/01](../02-tenancy/01-identity-and-isolation.md).
- CORS stays narrow: the backend allow-list is the three known origins (and dev ports),
  never `*`. See `../../backend/src/main/java/com/elanjaibuildos/backend/security/SecurityConfiguration.java`
  when implementing.

## Phased tasks — Phase A (P0)

**A1. Scaffold apps (no behavior change).**

- [ ] Create `frontend-landing/`, `frontend-admin/`, `frontend-tenant/`, each with its
  own `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `tailwind.config.js`.
  Reuse the root files (`../../vite.config.ts`, `../../tsconfig.json`, etc.) as
  templates — same React 19 + TS + Vite 7 + Tailwind 4 stack (`../../requirement.md`
  Tech Stack).
- [ ] Each app installs independently (`npm ci` inside its own directory) and produces
  its own `dist/`. No shared `node_modules` assumption.
- [ ] Keep the root `src/` bundle untouched and deployable until cutover.

**A2. Move code per the file map above.**

- [ ] `frontend-tenant`: `AppMVP.tsx`, `components/mvp/` (including the existing
  tenant `LoginPage.tsx` — the `/login` screen lives there, mounted by `AppMVP`, not
  in `saas/pages.tsx`), `components/` pieces it uses, `saas/TenantShell.tsx`,
  `saas/TenantBilling.tsx`, tenant-auth pages split out of `saas/pages.tsx`
  (ForgotPassword, ResetPassword, AcceptInvite, WorkspaceNotFound), and the
  tenant-domain `lib/` files.
- [ ] `frontend-landing`: Landing, Pricing, Signup, VerifyEmail, PendingApproval split
  out of `saas/pages.tsx`, plus new `/login` directory page and shared marketing
  layout/footer if present.
- [ ] `frontend-admin`: `saas/AdminConsole.tsx` + `AdminLogin` and any platform-only
  components; give it a minimal layout of its own (no `TenantShell`).
- [ ] Duplicate `components/ui/` + styling glue into each app that needs it (deliberate
  short-term duplication; `packages/ui` promotion is a P1 trigger, not part of A2).
- [ ] Per-app `lib/api.ts` with the renamed storage keys; per-app `lib/tenant.ts`
  reduced to what that app needs.
- [ ] Delete moved code from root `src/` only in the same PR that switches compose to
  the new apps, or keep root `src/` buildable until R3 cutover ([rollout](../03-deployment/02-rollout-and-rollback.md)). Prefer the latter.

**A3. Per-app runtime config.**

- [ ] `frontend-landing` env: `VITE_BASE_DOMAIN`, `VITE_TENANT_URL_TEMPLATE` (or reuse
  `tenantUrl(slug)` semantics), `VITE_API_BASE_URL` for public endpoints only.
- [ ] `frontend-tenant` env: `VITE_API_BASE_URL`, `VITE_BASE_DOMAIN`,
  `VITE_DEV_TENANT_PARAM` (dev only).
- [ ] `frontend-admin` env: `VITE_API_BASE_URL`, `VITE_ADMIN_HOST`.
- [ ] No app reads another realm's env or storage keys.

**A4. Per-app packaging (details in [03-deployment/01](../03-deployment/01-independent-delivery.md)).**

- [ ] `frontend-landing/Dockerfile` — build context is `frontend-landing/` **only**;
  the landing image must never `COPY` tenant or admin sources.
- [ ] `frontend-tenant/Dockerfile`, `frontend-admin/Dockerfile` — same pattern.
- [ ] Per-app `nginx.conf` — SPA fallback for owned routes; `/api/` proxy block that
  preserves the canonical external `Host` (`proxy_set_header Host $host`, as today's
  `../../nginx.conf` already does) and never forwards client-supplied
  `X-Forwarded-*`/tenant headers; route-ownership guardrails (unknown paths →
  app-specific 404 or redirect, not another app's page).
- [ ] Compose services `landing`, `tenant`, `admin` replacing `frontend`, plus a
  `gateway` service; keep `postgres`, `backend`, `mailpit` unchanged.

**A5. Wire and verify.**

- [ ] All three apps build (`npm run build` in each).
- [ ] Dev routing works via `*.localhost` and/or distinct ports (landing `:5173`,
  tenant `:5174`, admin `:5175` — or gateway `:80` with `*.localhost`; both documented
  in [03-deployment/01](../03-deployment/01-independent-delivery.md)).
- [ ] Tenant login → JWT → tenant routes work end-to-end on `<slug>.localhost`.
- [ ] Admin login works only on `admin.localhost`. Realm enforcement is **net-new
  backend work in Phase A**, not something to assume: today `SecurityConfiguration`
  guards `/api/admin/**` by role and every other path by `anyRequest().authenticated()`,
  so a platform JWT may authenticate on tenant endpoints without a `TenantContext`.
  Required: tenant endpoints demand a tenant-realm token + bound `TenantContext`
  (fail closed when none), platform realm limited to admin/platform paths — spec and
  negative tests in [02-tenancy/01](../02-tenancy/01-identity-and-isolation.md) and
  [04-quality/02](../04-quality/02-verification-matrix.md).
- [ ] Unknown `<slug>` host → tenant app calls the public workspace-status lookup and
  renders `/workspace-not-found` (guard implemented in the app, not just routed).
- [ ] Apex `/login` navigates `sanjay@acme` / `acme` → `acme.<base>/login` with no
  identifiers in the URL; a bare email prompts for workspace.

**A6. Path-scoped CI (P0 — part of the split, not Phase B).**

- [ ] CI filters on changed paths: `frontend-landing/**` builds/tests/images only
  landing; likewise tenant/admin; `backend/**` builds/tests only the backend.
- [ ] Shared paths trigger dependents: `packages/**` (once it exists) rebuilds the
  apps that consume it; `deploy/**`/`docker-compose.yml`/gateway config changes run
  the gateway/routing checks.
- [ ] A landing-only PR demonstrably produces no tenant/admin/backend pipeline runs —
  this is what makes independent delivery real rather than aspirational.

## Ownership, URLs, environment

| Item | Owner (suggested) | Notes |
|---|---|---|
| `frontend-landing` | frontend | marketing pages, signup funnel, `/login` directory page |
| `frontend-tenant` | frontend | workspace app — the bulk of today's `src/` |
| `frontend-admin` | frontend | platform console; smallest app |
| `packages/*` | shared | only when trigger met |
| Gateway config | platform/devops | see [03-deployment/01](../03-deployment/01-independent-delivery.md) |
| Backend Phase A scope | backend | CORS allow-list, email-link host updates, realm/tenant-context enforcement, `TENANT_DEV_HEADER` fail-closed default, public workspace-status endpoint — see [02-tenancy/01](../02-tenancy/01-identity-and-isolation.md) |

## Acceptance criteria — Phase A

- [ ] `docker build` of `frontend-landing/` does not include `frontend-tenant/`,
  `frontend-admin/`, or old `src/` — verify via `docker build` context size and
  `docker run <img> ls /usr/share/nginx/html` showing only landing assets.
- [ ] Landing-only content edit → rebuild produces a new `buildos-landing` image;
  `buildos-tenant`, `buildos-admin`, `backend` digests unchanged and containers not
  restarted.
- [ ] Route ownership table above holds in each app's router and nginx fallback.
- [ ] No cross-realm token use; `X-Tenant-ID` honored only when `TENANT_DEV_HEADER=true`,
  and that flag defaults off/fails closed outside dev compose.
- [ ] Path-scoped CI verified: a landing-only diff triggers only the landing pipeline.
- [ ] All flows in `../../requirement.md` Pages list still reachable on correct hosts
  (landing/pricing/signup/pending/verify on apex; login/forgot/reset/accept-invite/
  billing/workspace on tenant host; admin console on admin host).
- [ ] Existing email/deep links still resolve — see
  [03-deployment/01](../03-deployment/01-independent-delivery.md#legacy-links).

## Risks & dependencies

| Risk | Mitigation |
|---|---|
| Copying `components/ui` into 3 apps drifts apart | Track duplicated files; promote to `packages/ui` at the P1 trigger ([04-quality/01](../04-quality/01-reusable-enhancements.md)) |
| `pages.tsx` is one module — splitting needs care not to strand shared sub-components | Extract shared pieces into the app's own `components/` first, then move pages |
| Backend emails/links hardcode old host assumptions | Audit backend mail templates (`platform/service/PlatformMailService.java`, `FileStorageService` URLs) during A3; parameterized by `TENANT_BASE_DOMAIN`/`TENANT_ADMIN_HOST` already in compose env |
| Dev workflows relying on `?tenant=`/`localStorage` break | Keep overrides in tenant app behind `VITE_DEV_TENANT_PARAM`; document in README of the app |
| SPA history fallback serves the wrong app for an unknown host | Gateway routes strictly by host; unmatched slugs land on the tenant app, which resolves them via the public workspace-status lookup and renders `/workspace-not-found` — verify in A5 |

## Rollback

- Until cutover, root `src/` + `Dockerfile.frontend` + the `frontend` compose service
  remain intact — deployment can revert to the combined image at any point.
- After cutover, rollback is per-image digest — see
  [03-deployment/02](../03-deployment/02-rollout-and-rollback.md).
