# 02 — Rollout and Rollback

[← Roadmap](../README.md) · Prev: [01 — Independent Delivery](01-independent-delivery.md)

## Purpose

A runbook for cutting over from the single `frontend` image to three
independently-deployed apps — staged, reversible, and safe to pause at every step.

## Principles

1. **Expand before contract.** New apps deploy *alongside* the existing combined
   frontend; the old service is removed only after the new path is proven.
2. **Immutable artifacts.** Images are tagged `buildos-<app>:<git-sha>` and promoted
   by digest. Rollback = repoint to the previous digest — never rebuild "the same"
   tag. Digest promotion/rollback applies to the non-dev deployment target (P1); dev
   compose uses local `*:dev` tags.
3. **Smallest blast radius first.** Cut over in order: landing → admin → tenant
   wildcard. Landing has no auth surface and no tenant data; tenant is last and most
   sensitive.
4. **DB moves only expand/contract.** No destructive migration ships in the same
   window as a cutover; backups precede any schema change
   ([02-tenancy/02](../02-tenancy/02-provisioning-and-migrations.md)).
5. Every stage has a defined "still safe" state — pausing mid-rollout must leave a
   coherent system.

## Pre-flight checklist (before R0)

- [ ] Three apps build green; per-app images tagged by SHA exist in the registry/compose.
- [ ] Path-scoped CI (P0) verified: each app's pipeline triggers only on its own paths
      plus shared `packages/**`/deploy/gateway dependencies.
- [ ] `deploy/gateway.conf` written and smoke-reviewed (host map only — no tenant
      logic in the gateway beyond `Host` routing).
- [ ] Backend env updated: `CORS_ALLOWED_ORIGINS` lists the three origins;
      `TENANT_DEV_HEADER=false` outside dev; email-link base host envs verified.
- [ ] Old combined `frontend` image digest recorded — it is the global rollback anchor.
- [ ] `pg_dump` backup of `public` + all `t_*` schemas taken before any migration in
      the rollout window; restore path verified once.
- [ ] Smoke suite runnable (see [verification matrix](../04-quality/02-verification-matrix.md)).

## Stages

### R0 — Parallel deploy (no traffic change)

- [ ] Build `buildos-landing`, `buildos-tenant`, `buildos-admin` images; add services
      + `gateway` to compose **without removing** `frontend` and **without** DNS/host
      changes (gateway binds an alternate port, e.g. `:8088`).
- [ ] Hit gateway directly on the alternate port for each host class:
      `curl -H "Host: admin.localhost" localhost:8088/`, etc. — assert right app,
      right `/api/` behavior.
- [ ] **Safe state:** old path fully live; new path reachable only via the test port.
- [ ] Rollback: remove the new services (or just don't cut over).

### R1 — Landing cutover

- [ ] Point apex/`www` traffic at the gateway (DNS or port swap — environment
      dependent; document actual step per environment).
- [ ] Smoke: `/`, `/pricing`, `/signup` render; signup → `/pending` → email link →
      `/verify-email` works; apex `/login` directory page navigates
      `acme` → `acme.<base>/login` with no identifiers in the URL; `robots.txt`/meta
      served; `index.html` not cached.
- [ ] Watch logs/metrics for one business window before proceeding.
- [ ] Rollback: repoint apex to the old combined image digest (it still serves landing
      routes at `/`); no data change involved.

### R2 — Admin cutover

- [ ] Point `admin.<base>` at the gateway → admin image.
- [ ] Smoke: `/admin/login` authenticates a **platform** user; console loads; admin
      token rejected on tenant API surface; tenant token rejected on admin surface —
      this requires the P0 realm/tenant-context enforcement
      ([02-tenancy/01](../02-tenancy/01-identity-and-isolation.md), matrix A6) to be
      merged first; it is **not** guaranteed by today's `SecurityConfiguration`.
- [ ] **Safe state:** apex + admin on new stack; tenant traffic still on old image.
- [ ] Rollback: repoint `admin.<base>` to old image digest.

### R3 — Tenant wildcard cutover

- [ ] Point `*.<base>` (and `*.localhost` in dev) at the gateway → tenant image.
- [ ] Smoke per matrix: tenant login (email; later `<local>@<slug>`), dashboard,
      `/billing`, `/forgot-password` → `/reset-password`, `/accept-invite`,
      unknown slug → workspace-status lookup → `/workspace-not-found`;
      uploaded-file URLs load; `X-Tenant-ID` ignored in production mode.
- [ ] After a soak window, remove the old `frontend` service and `Dockerfile.frontend`/
      `nginx.conf` from the active deploy path (keep them in git history — do not
      delete until the soak completes).
- [ ] Rollback: repoint wildcard to old image digest while it still exists; after
      removal, rollback is tenant-image digest rollback.

## Rollback mechanics per layer

| Layer | Rollback action | Data risk |
|---|---|---|
| One frontend app | redeploy previous image digest; gateway unchanged | none |
| Gateway config | restore previous `gateway.conf`; reload | none |
| Backend | redeploy previous backend image | only if paired migration is contract-safe — never roll back past an expand/contract boundary without review |
| Public migration | expand/contract: roll forward, or restore pre-change `pg_dump` | restore loses post-backup writes — escalate, don't auto-restore |
| Tenant schema (provisioning) | compensation per [02-tenancy/02](../02-tenancy/02-provisioning-and-migrations.md) — **never drop** an existing/active schema | guard + tests |

## Rollback triggers (decide ahead, don't improvise)

Roll back the current stage if any of:

- [ ] Auth failures spike: elevated 401/403 on any host class beyond baseline noise.
- [ ] Any cross-tenant signal: a tenant host serving another tenant's data or shell —
      **immediate rollback + incident**, not a retry.
- [ ] `/api/` failures on one host class only (gateway misroute).
- [ ] Email link breakage (verify/reset/invite) reported or smoke-failed.
- [ ] Error-rate or latency breach attributable to the new path, sustained beyond a
      threshold the team sets — this doc asserts no SLO; pick one in the runbook.

## Order-of-operations summary

| # | Step | Touches | Reversible by |
|---|---|---|---|
| 1 | Build 3 app images, tag by SHA | CI | n/a |
| 2 | Deploy gateway + new services on alt port (R0) | compose | remove services |
| 3 | Cut apex → landing (R1) | DNS/routing | repoint to old image |
| 4 | Cut `admin.<base>` → admin (R2) | DNS/routing | repoint |
| 5 | Cut `*.<base>` → tenant (R3) | DNS/routing | repoint (until old image retired) |
| 6 | Soak, then retire combined `frontend` | compose/repo | digest rollback thereafter |

## Ownership

| Task | Owner |
|---|---|
| Image builds + tags | CI/release |
| Gateway config | platform/devops |
| Cutover execution + go/no-go | release lead |
| Smoke suite per stage | frontend + backend owners jointly |
| Backup/restore drill | platform/devops |
| Incident call on cross-tenant signal | release lead + backend owner — always treated as sev-high |

## Acceptance criteria

- [ ] Full rehearsal in dev compose: R0→R3 executed against `*.localhost` with the
      smoke suite green at each stage.
- [ ] Rehearsed rollback: mid-stage repoint to the old combined image works; a single
      app's digest rollback works after cutover.
- [ ] Backup produced before the rollout window and a restore drill completed once.
- [ ] Every rollback trigger above has a concrete check in the smoke suite or
      monitoring.

## Risks & dependencies

| Risk | Mitigation |
|---|---|
| Wildcard DNS/cert unavailable in target env | Out of dev scope per `../../requirement.md`; stages still apply with whatever host mechanism the env provides — document the concrete repoint step per environment |
| Old image retired before tenant soak | Keep old digest available ≥1 release cycle post-R3 |
| Gateway misroute sends tenant host → landing | Route tests in R0 for every host class; `*.<base>` rule is the only wildcard |
| Partial cutover confuses support ("which stack am I on?") | Each stage lists exactly which host classes moved; app version/SHA surfaced (e.g. footer or `/version` asset) |

## Dependencies

- Phase A extraction and per-app packaging
  ([01-architecture/02](../01-architecture/02-frontend-extraction.md),
  [independent delivery](01-independent-delivery.md)).
- Verification suite: [04-quality/02](../04-quality/02-verification-matrix.md).
- Backup/compensation policy: [02-tenancy/02](../02-tenancy/02-provisioning-and-migrations.md).
