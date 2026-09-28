# 02 — Verification Matrix

[← Roadmap](../README.md) · Prev: [01 — Reusable Enhancements](01-reusable-enhancements.md)

## Purpose

Consolidated acceptance surface for the whole roadmap. Each row names the check, its
type, and the phase that must not ship without it. Rows marked **net-new** require
creating backend tests — no `backend/src/test/java` exists today.

Test types: **U** unit · **I** integration (Spring context / Testcontainers Postgres)
· **E2E** browser-level across the three apps · **M** manual/scripted runbook check.

## A. Tenancy and isolation (Phase A — P0)

| # | Check | Type | Pass criteria | Related spec |
|---|---|---|---|---|
| A1 | Slug validation | U | `^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$` (as in `SignupService`), 3–30 chars, reserved blocklist, immutability enforced (BR-001); 1–2-char inputs rejected | [02-tenancy/01](../02-tenancy/01-identity-and-isolation.md) |
| A2 | Schema identifier quoting | U+I | `schemaFor("acme-shop")` → `t_acme-shop`; `SET search_path` executes with quoted identifier; malformed identifiers fail closed | [02-tenancy/01](../02-tenancy/01-identity-and-isolation.md) |
| A3 | Hyphenated tenant end-to-end | I | provision `acme-shop` → migrate → create owner → log in → CRUD works | [02-tenancy/02](../02-tenancy/02-provisioning-and-migrations.md) |
| A4 | Cross-tenant isolation | I (**net-new**) | tenant A JWT → request to host B → rejected; A's connection never reads B's rows even when both schemas hold same table names | [02-tenancy/01](../02-tenancy/01-identity-and-isolation.md) |
| A5 | Connection pool reset | I (**net-new**) | exception thrown mid-tenant transaction; connection returned to pool; next borrow shows `search_path = public`; repeat under concurrent borrows | [02-tenancy/01](../02-tenancy/01-identity-and-isolation.md) |
| A6 | Realm isolation | I (**net-new** — covers a real gap: today `anyRequest().authenticated()` may let a platform JWT reach tenant paths) | platform token on tenant endpoint → rejected; tenant token on `/admin` API → rejected (requires the P0 enforcement in `JwtAuthenticationFilter`/`SecurityConfiguration`) | [02-tenancy/01](../02-tenancy/01-identity-and-isolation.md) |
| A7 | Dev-header gating | I | `X-Tenant-ID` honored with `TENANT_DEV_HEADER=true`, ignored/never consulted when `false`; `?tenant=` affects nothing server-side | [02-tenancy/01](../02-tenancy/01-identity-and-isolation.md) |
| A8 | Host spoofing | I | request whose `Host` disagrees with the JWT tenant claim → rejected; inbound `X-Forwarded-*`/`X-Tenant-ID` at the edge can't substitute a tenant (suffix-in-body assertions belong to B1 — username auth is Phase B) | [02-tenancy/01](../02-tenancy/01-identity-and-isolation.md), [03-deployment/01](../03-deployment/01-independent-delivery.md) |
| A9 | Lifecycle gates | I | login allowed TRIAL/ACTIVE/GRACE, blocked SUSPENDED; grace is read-only (write → 403); plan-limit breach → `403 PLAN_LIMIT` (BRs) | `../../requirement.md` |
| A10 | Email uniqueness scope | I | same email allowed in two tenant schemas, duplicate blocked within one (BR-001) | [02-tenancy/01](../02-tenancy/01-identity-and-isolation.md) |
| A11 | Fail-closed no-tenant | I (**net-new**) | authenticated request on a tenant-scoped path with no resolvable `TenantContext` (unmatched/unknown host) → rejected, never served as anonymous/public | [02-tenancy/01](../02-tenancy/01-identity-and-isolation.md) |
| A12 | Dev-header default | I/M | `TENANT_DEV_HEADER` unset/absent in `application.properties` → `false`; `X-Tenant-ID` honored only when explicitly `true` in dev compose | [02-tenancy/01](../02-tenancy/01-identity-and-isolation.md) |

## B. Identity (Phase B — P1, unless shipped early)

| # | Check | Type | Pass criteria |
|---|---|---|---|
| B1 | Username sign-in | I | `<local>` and `<local>@<slug>` authenticate on the right host; precedence = exact normalized email first, then username; `<local>@wrongslug` on `acme.<base>` → rejected; `user@mail.com` (and legacy `user@acme` emails) still authenticate via email lookup |
| B1a | Wrong-tenant suffix rejection | I (**negative**) | `sanjay@acme` on `beta.<base>` where it is **not** a stored email in beta's schema → rejected before username lookup, no fallback; a real email that exists only in another tenant's schema grants no access on `beta.<base>` |
| B1b | Identifier disjointness | I (**negative**, write-time) | username candidate equal to **any** stored email (incl. same user's) → rejected; email candidate equal to **any** stored username (incl. same user's) → rejected; preexisting collision found in backfill → `username` stays `NULL` + flagged; ambiguous identifier never authenticates |
| B2 | Backfill idempotency | I (**net-new** job test) | run the per-tenant backfill job twice → identical rows; collisions skipped → `NULL` + flagged in deterministic order; invalid local-parts sanitized or skipped and reported; existing usernames untouched; audit + status report emitted |
| B3 | Email fallback | E2E | account created pre-username still logs in with email + host |
| B4 | Apex directory login | E2E | apex `/login` with `acme` or `x@acme` → client-side navigation to `acme.<base>/login` with **no identifiers in the URL**; bare `user@mail.com` → ask for workspace; **no credential verification on apex** |
| B5 | Platform realm untouched | I | admin login on `admin.<base>` unchanged; no username requirement |

## C. Frontend split (Phase A — P0)

| # | Check | Type | Pass criteria | Related spec |
|---|---|---|---|---|
| C1 | Route ownership | E2E | every row of the route table resolves on its app; unknown paths → app-appropriate 404 | [01-architecture/02](../01-architecture/02-frontend-extraction.md) |
| C2 | Token isolation | E2E | tenant app storage has only `buildos.tenant.*`; admin only `buildos.admin.*`; a token minted in one app is never sent by another | [01-architecture/02](../01-architecture/02-frontend-extraction.md) |
| C3 | No cross-app source | M | landing image filesystem contains no tenant/admin source or chunks (build-context scoped); `docker run` inspect or image export diff | [03-deployment/01](../03-deployment/01-independent-delivery.md) |
| C4 | Full user journeys | E2E | signup→verify→pending→approve→tenant login→dashboard; invite accept; forgot→reset; billing page; admin approve/suspend flow | `../../requirement.md` page list |
| C5 | `admin_console` removal | U/E2E | no production path sets `localStorage admin_console`; admin access only via `admin.<base>` host | [01-architecture/02](../01-architecture/02-frontend-extraction.md) |

## D. Deployment independence (Phase A/B)

| # | Check | Type | Pass criteria | Related spec |
|---|---|---|---|---|
| D1 | Landing-only deploy | M | landing edit → only `buildos-landing` rebuilt/redeployed; other containers' start times and digests unchanged | [03-deployment/01](../03-deployment/01-independent-delivery.md) |
| D2 | Gateway host map | M/I | apex/www→landing, `admin.*`→admin, `*.<base>`→tenant; unknown slug→tenant app → workspace-status lookup → `/workspace-not-found`; every hop preserves canonical `Host` (backend reads raw `Host`, not `X-Forwarded-Host`); edge strips inbound `X-Forwarded-*`/`X-Tenant-ID`; backend not directly reachable outside the edge | [03-deployment/01](../03-deployment/01-independent-delivery.md) |
| D3 | Legacy/deep links | E2E | `/accept-invite?token=`, `/reset-password?token=`, `/verify-email?token=`, `/billing`, `/pending` resolve post-cutover on correct hosts | [03-deployment/01](../03-deployment/01-independent-delivery.md) |
| D4 | Rollback drill | M | per-app digest rollback; mid-stage repoint to combined image pre-R3; documented timings | [03-deployment/02](../03-deployment/02-rollout-and-rollback.md) |
| D5 | Headers/SEO | M | P0 basics: landing `index.html` no-cache + hashed assets immutable; `robots.txt` + meta/OG on landing; `noindex` on tenant+admin; CSP per app. `sitemap.xml` is P1-optional (see P1-6) | [03-deployment/01](../03-deployment/01-independent-delivery.md) |
| D6 | File URLs | E2E | uploads/photos served via `/api/...` work on tenant host post-cutover; no stored absolute URLs to retired hosts | [03-deployment/01](../03-deployment/01-independent-delivery.md) |

## E. Provisioning and migrations (E1 Phase A — P0; E2–E5 Phase B)

| # | Check | Type | Pass criteria | Related spec |
|---|---|---|---|---|
| E1 | Idempotent approve **(Phase A)** | I (**net-new**) | duplicate `approve` of same signup → single tenant/schema/owner; no 500 | [02-tenancy/02](../02-tenancy/02-provisioning-and-migrations.md) |
| E2 | Resume after crash **(Phase B)** | I (**net-new**) | kill between pipeline steps → re-run completes to TRIAL; not promised at P0 | [02-tenancy/02](../02-tenancy/02-provisioning-and-migrations.md) |
| E3 | Compensation guard **(Phase B, whenever compensation is introduced)** | I (**net-new**) | compensation allowed for PROVISIONING/FAILED; **refused** for TRIAL/ACTIVE/GRACE/SUSPENDED; Phase A adds only the drop-guard on live schemas | [02-tenancy/02](../02-tenancy/02-provisioning-and-migrations.md) |
| E4 | Tenant-track rollout **(Phase B)** | M/I | new tenant migration applies to all `t_*` schemas; one failing schema doesn't block others; report lists per-schema result | [02-tenancy/02](../02-tenancy/02-provisioning-and-migrations.md) |
| E5 | Expand/contract | M | destructive change only after expand+backfill+release, with pre-change `pg_dump` evidenced | [02-tenancy/02](../02-tenancy/02-provisioning-and-migrations.md) |

## F. CI path-scoping matrix — P0 (ships with the frontend split)

| Change under | Jobs that must run | Jobs that must NOT run |
|---|---|---|
| `frontend-landing/**` | landing lint+test+build+image | tenant/admin/backend builds |
| `frontend-tenant/**` | tenant lint+test+build+image | landing/admin/backend builds |
| `frontend-admin/**` | admin lint+test+build+image | landing/tenant/backend builds |
| `packages/**` (when it exists) | dependent app builds + package tests | unrelated apps |
| `backend/**` | backend unit + integration (A-rows) | frontend builds |
| `deploy/**`, `docker-compose.yml`, gateway conf | gateway config test + D-row checks | app rebuilds (except compose validation) |
| `Prody enhancements/**` (docs) | markdown lint/link check only | everything else |

## How to use this matrix

- Phase A ships when **all A + C + D1–D3 + D5 basics (robots/noindex/cache/CSP) +
  E1** rows pass and path-scoped CI (F) is live.
- Phase B ships when **B + D4 + D6 + E2–E5** rows pass; digest-promotion rollback
  (D4) applies once a non-dev deployment target exists.
- Every row should exist as an automated check where marked U/I/E2E; M-rows are
  runbook steps recorded in release notes.
- New features must state which matrix rows they touch in their PR description.
