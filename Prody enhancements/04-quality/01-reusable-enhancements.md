# 01 — Reusable Enhancements Catalog

[← Roadmap](../README.md) · Next: [02 — Verification Matrix](02-verification-matrix.md)

## Purpose

A prioritized catalog of enhancements that are **generic** — useful beyond the
frontend split — each with an adoption trigger so nothing is built before it earns
its complexity. Tiers: **P0** = required for the split to be safe; **P1** = adopt in
Phase B when the trigger is met; **P2** = adopt only as warranted.

> Rule of thumb: shared packages and frameworks are extracted **from** working code
> after duplication or failure is observed — never speculatively.

## P0 — required with the frontend split

### P0-1 Independent frontend images

- **What:** per-app Dockerfile + nginx + compose service + image name; landing build
  context scoped so it can never contain tenant/admin sources.
- **Spec:** [01-architecture/02](../01-architecture/02-frontend-extraction.md),
  [03-deployment/01](../03-deployment/01-independent-delivery.md).
- **Done when:** landing-only deploy changes only `buildos-landing`'s digest.

### P0-2 Realm isolation and security hardening

- **What:** per-app token storage keys; dev-only `X-Tenant-ID`/`?tenant=`/
  `admin_console` overrides with `TENANT_DEV_HEADER` defaulting `false`/fail-closed
  (it currently defaults `true` in `application.properties`); narrow CORS allow-list;
  quoted schema identifiers; exception-proof `search_path` reset; **explicit
  realm/path/tenant-context
  enforcement** (tenant endpoints require a tenant-realm token + bound
  `TenantContext`, fail closed when none; platform realm valid only on
  admin/platform paths — not guaranteed by today's `SecurityConfiguration`).
  (The suffix-must-match-host sign-in rule arrives with the username feature in
  Phase B — not P0.)
- **Spec:** [02-tenancy/01](../02-tenancy/01-identity-and-isolation.md).
- **Done when:** the isolation/security rows of the
  [verification matrix](02-verification-matrix.md) pass, including the
  hyphenated-slug, pooled-connection, realm-crossing, and fail-closed cases.

### P0-3 Backend integration/isolation test base

- **What:** `backend/src/test/java` does not exist today — create it with the
  isolation suite (cross-tenant, realm, resolution, idempotent-approve) as the first
  citizens.
- **Done when:** the P0 matrix rows run in CI on backend changes.

### P0-4 Path-scoped per-app CI

- **What:** CI pipelines filtered by changed path — a `frontend-landing/**` change
  builds/tests/images only landing; `packages/**` (once it exists) and
  `deploy/**`/compose/gateway changes trigger their dependents. This is what makes
  "landing-only edit never builds/deploys backend/tenant/admin" enforceable rather
  than aspirational — it ships **with** the image separation, not after.
- **Spec:** path matrix in [verification doc](02-verification-matrix.md); app tasks in
  [01-architecture/02](../01-architecture/02-frontend-extraction.md) (A6).
- **Done when:** a landing-only PR demonstrably runs only the landing pipeline.

## P1 — Phase B, adopt when triggered

### P1-1 Typed API boundary packages (`packages/api-public`, `api-platform`, `api-tenant`)

- **What:** typed request/response + client functions per realm, mirroring the
  reference's `packages/api-tenant` / `packages/api-platform` layout; add
  `api-public` for the unauthenticated surface (signup, verify, reset).
- **Trigger:** the same endpoint shape is hand-maintained in ≥2 places **or** a
  backend contract change silently breaks a frontend. Until then, per-app `lib/api.ts`
  copies are acceptable.
- **How:** generate types from the backend OpenAPI if available, else hand-write DTO
  mirrors and cover with contract tests — do not hand-copy types per app.
- **Done when:** each frontend imports its realm's client; a backend DTO change fails
  a typecheck/contract test instead of failing at runtime.

### P1-2 `packages/ui` shared component package

- **What:** shared shadcn/Radix primitives, form controls, layout pieces.
- **Trigger:** the same non-trivial component is edited in ≥2 apps **or** a visual
  bug fix must be applied twice. Button-level primitives copied per app do **not**
  meet the bar.
- **Done when:** the duplicated inventory from Phase A2 collapses into one versioned
  package; each app pins a version.

### P1-3 Durable provisioning runner

- **What:** public-schema operation table + resumable runner (reference pattern:
  `ProvisionTenantOperation` / `DurableOperationRunner`).
- **Trigger:** basic idempotent stepwise provisioning
  ([02-tenancy/02](../02-tenancy/02-provisioning-and-migrations.md)) shows real
  failures needing resume/audit, **or** a second multi-step operation (e.g. tenant
  export/deletion request flow) appears. Record the justification in the PR.
- **Done when:** killed operations resume on restart; admin UI shows operation state;
  compensation still cannot touch active tenants.

### P1-4 Immutable-digest promotion + rollback (non-dev deployment target)

- **What:** deploy pins image digests (`buildos-<app>:<git-sha>` → digest promotion);
  rollback = redeploy previous digest. Dev compose uses local `*:dev` tags — this tier
  applies once a non-dev deployment target exists.
- **Spec:** [03-deployment/02](../03-deployment/02-rollout-and-rollback.md).
- **Done when:** a per-app digest rollback drill passes against the target env.

### P1-5 Backups and restore drills

- **What:** scheduled `pg_dump` (or volume snapshot) of `public` + all `t_*` schemas;
  documented restore; mandatory pre-step for destructive schema changes.
- **Trigger:** always P1 — required before the first non-dev rollout; in dev, at
  least one drill before R1.
- **Done when:** restore drill completes and is part of the rollout runbook.

### P1-6 Landing SEO/prerender

- **What:** prerendered/static `/` + `/pricing` and `sitemap.xml` for the landing app.
  The **basics are P0** and land with the split (meta/OG tags, `robots.txt` on
  landing, `X-Robots-Tag: noindex` on tenant/admin); this item is only the optional
  prerender/SSR upgrade.
- **Trigger:** only if worthwhile — after launch, if organic acquisition matters and
  crawler rendering is measured insufficient. The split alone already fixes the
  indexing surface.
- **Done when:** view-source shows meaningful content for `/` + `/pricing`.

## P2 — adopt only as warranted

### P2-1 Analytics

- Privacy-conscious product analytics on landing (conversion funnel: landing → signup
  → pending → verified) and aggregate admin-side metrics. Tenant-workspace event
  collection needs DPDP review (`../../requirement.md` compliance notes) before enabling.

### P2-2 Accessibility

- Audit pass on the three apps after the split (landing first — public surface);
  fix-list driven rather than a framework.

### P2-3 Observability

- Structured logs with tenant/request correlation (never logging tokens or PII),
  backend metrics endpoint, and per-app uptime checks on the three host classes.
  Trigger: needed for the R1–R3 soak windows at minimum; fuller stack as ops matures.

## Reusable patterns to carry forward

Patterns established here that future features should reuse rather than reinvent:

| Pattern | Where defined | Reuse when |
|---|---|---|
| Host-routed per-realm apps behind one gateway | [03-deployment/01](../03-deployment/01-independent-delivery.md) | any new app surface (e.g. docs site) |
| `<local>@<slug>` canonical identity, suffix-must-match-host | [02-tenancy/01](../02-tenancy/01-identity-and-isolation.md) | invites, support lookups, impersonation tooling |
| Stepwise idempotent ops + guarded compensation | [02-tenancy/02](../02-tenancy/02-provisioning-and-migrations.md) | tenant deletion/export, plan migrations |
| Expand/contract migrations + backup gate | [02-tenancy/02](../02-tenancy/02-provisioning-and-migrations.md) | every schema change |
| Plane rules (public/tenant/platform) | [01-architecture/03](../01-architecture/03-backend-service-boundaries.md) | every new backend feature |

## Explicitly out of scope / deferred (per `../../requirement.md`)

Custom domains, WhatsApp, mobile app, public API, Tally, MFA, i18n, dark mode —
"Won't — this release". Nothing in this catalog reintroduces them; revisit only with
a requirement change.
