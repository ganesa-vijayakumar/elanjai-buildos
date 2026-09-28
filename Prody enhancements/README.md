# BuildOS Productivity Enhancements — Implementation Roadmap

This directory contains **implementation instructions only** — no application code,
configuration, or CI changes are made by these documents. Each document is written so a
future implementer can execute a phase end-to-end: current state, target design, phased
tasks with ownership and acceptance criteria, risks, dependencies, and rollback.

## Goal

Split the single React SPA into **three independently built and independently deployable
frontends** (landing / admin / tenant), harden tenant identity and schema isolation, and
organize the existing Spring backend into a modular monolith — while keeping:

- **One monorepo** (this repository).
- **One backend binary/service** (`../backend/`) — no backend microservices in this phase.
- **One PostgreSQL server/container** (`postgres`) with a `public` registry schema plus
  one schema per tenant (`t_<slug>`) — no per-tenant databases, backends, or frontends.

The headline outcome: a landing-page-only change must build and promote **only** the
landing image. It must never rebuild or restart the tenant app, admin app, or backend.

## How to read these docs

- Each doc covers the sections appropriate to its topic — current state, target
  design, phased tasks, acceptance criteria, risks/dependencies — and rollback is
  covered per-area where applicable and consolidated in
  [03-deployment/02](03-deployment/02-rollout-and-rollback.md).
- Statements are labeled **Observed** (verified in code today) vs **Recommended**
  (the design to implement). Nothing in a *Recommended* section exists yet.
- `buildos.example`, `<base>`, `<slug>` are placeholders, not real domains.
- File links are relative to this repo. From this README, repo files resolve via `../`;
  from docs inside `NN-*/` subdirectories they resolve via `../../`.

## Source references

| Source | What it is |
|---|---|
| This repo | `../` — the BuildOS monorepo under change |
| Reference repo | `D:\elanjaitech\source\elanjai-office-pro`, examined at local HEAD `6e53e00a3441cce1348cfa89cfe0a0fc76a897c4`; remote `main` is `9556cc5e16dc2785ccd880d3e35b7e80dccfaea8` (8 commits ahead, mostly admin-assisted onboarding and password-change). Used as a **pattern source only** — see [01-architecture/01](01-architecture/01-reference-gap-and-target.md) for what does and does not transfer |
| Product rules | `../requirement.md` — BR-001..BR-025, page list, tech stack, dev-only deployment scope |

## Document index

| Doc | Purpose |
|---|---|
| [01-architecture/01-reference-gap-and-target.md](01-architecture/01-reference-gap-and-target.md) | What the reference repo actually does (including its deployment gap), current-vs-target gap table, and what to adopt vs deliberately not adopt |
| [01-architecture/02-frontend-extraction.md](01-architecture/02-frontend-extraction.md) | File-by-file extraction plan into `frontend-landing/`, `frontend-admin/`, `frontend-tenant/` with route ownership, token isolation, and per-app build rules |
| [01-architecture/03-backend-service-boundaries.md](01-architecture/03-backend-service-boundaries.md) | Modular-monolith reorganization of `backend/` into feature packages with explicit public/tenant/platform plane rules |
| [02-tenancy/01-identity-and-isolation.md](02-tenancy/01-identity-and-isolation.md) | `<local>@<slug>` username sign-in (canonical for new users; email+host retained in transition), resolution contract, realm/tenant-context enforcement, schema-identifier quoting fix, pooled-connection reset hardening, isolation test requirements |
| [02-tenancy/02-provisioning-and-migrations.md](02-tenancy/02-provisioning-and-migrations.md) | Stepwise idempotent provisioning, safe compensation, dual-Flyway expand/contract migration policy, lifecycle states |
| [03-deployment/01-independent-delivery.md](03-deployment/01-independent-delivery.md) | Per-app images, central gateway host-based routing, `/api` proxy and canonical `Host` preservation rules, dev wildcard/ports, CSP/cache/SEO, deep-link preservation |
| [03-deployment/02-rollout-and-rollback.md](03-deployment/02-rollout-and-rollback.md) | Cutover runbook: shadow/parity, per-host rollout order, immutable digests, rollback per app, DB rollback rules |
| [04-quality/01-reusable-enhancements.md](04-quality/01-reusable-enhancements.md) | Prioritized catalog (P0/P1/P2) of reusable enhancements with adoption triggers — typed API packages, `packages/ui`, durable operations, CI scoping, backups, SEO, observability |
| [04-quality/02-verification-matrix.md](04-quality/02-verification-matrix.md) | Consolidated test/verification matrix: isolation, security, provisioning, deployment independence, legacy links, CI path-scoping |

## Phase map

| Phase | Priority | Contents | Docs |
|---|---|---|---|
| **A** | P0 | Frontend extraction into three apps with independent images; realm/token isolation + backend realm/tenant-context enforcement; schema-identifier quoting + connection-reset fixes; idempotent approve + drop-guard; mandatory isolation/integration tests; path-scoped CI so a landing-only change builds only landing | [01-architecture/02](01-architecture/02-frontend-extraction.md), [02-tenancy/01](02-tenancy/01-identity-and-isolation.md), [02-tenancy/02](02-tenancy/02-provisioning-and-migrations.md), [03-deployment/01](03-deployment/01-independent-delivery.md), [04-quality/02](04-quality/02-verification-matrix.md) |
| **B** | P1 | Backend modular-monolith reorganization; typed API boundary where duplication warrants; stepwise resumable/durable provisioning (if justified); username rollout + controlled backfill; immutable-digest promotion + rollback for the non-dev deployment target; backups; landing SEO/prerender evaluation | [01-architecture/03](01-architecture/03-backend-service-boundaries.md), [02-tenancy/01](02-tenancy/01-identity-and-isolation.md), [02-tenancy/02](02-tenancy/02-provisioning-and-migrations.md), [03-deployment/02](03-deployment/02-rollout-and-rollback.md), [04-quality/01](04-quality/01-reusable-enhancements.md) |
| **C** | P2 | Analytics, accessibility, observability — adopted only as warranted | [04-quality/01](04-quality/01-reusable-enhancements.md) |

## Invariants (do not violate in any phase)

1. One backend binary; one PostgreSQL; `public` + `t_<slug>` schemas. No per-tenant
   instances of anything.
2. Tenant slug: 3–30 chars, lowercase alphanumeric + hyphen, reserved blocklist,
   immutable (BR-001, `../requirement.md`).
3. Email stays unique **per tenant schema** and remains the delivery contact; the
   `<local>@<slug>` username is an additive nullable column that becomes the canonical
   sign-in identifier for new tenant users and is backfilled for existing ones — no
   forced renames.
4. Landing builds/deploys alone. A landing image build must never `COPY` tenant or admin
   sources.
5. Authorization is never derived from a URL suffix, a `?tenant=` param, or a
   client-supplied tenant/forwarded header alone. The authoritative chain is the
   canonical `Host` → `TenantContext` → JWT realm + tenant claim → the user row inside
   that tenant's schema; platform-realm tokens must not satisfy tenant endpoints
   (explicit P0 enforcement — not fully enforced today). Dev overrides stay gated
   behind a flag that fails closed outside dev.
6. Compensation/rollback **never drops an existing or active tenant schema**. Backups
   precede any destructive schema change; migrations follow expand/contract.
7. No real domains, secrets, or credentials in docs or examples. Dev defaults flagged as
   vulnerable (e.g. the `JWT_SECRET` fallback in `../docker-compose.yml`) must not be
   copied into any non-dev config.

## Acceptance for this instruction set itself

- [x] Docs only — no code/config/CI diffs outside this directory.
- [x] All intra-doc and repo-relative links resolve.
- [x] `git diff --check` clean; `git status` shows only new files under
  `Prody enhancements/`.
