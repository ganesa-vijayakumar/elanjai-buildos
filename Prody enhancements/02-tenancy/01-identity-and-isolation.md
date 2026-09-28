# 01 — Tenant Identity and Isolation

[← Roadmap](../README.md) · Next: [02 — Provisioning and Migrations](02-provisioning-and-migrations.md)

## Purpose

Define the tenant sign-in identity model (`<local>@<slug>` username — canonical for
new tenant users, email+host retained through transition), the tenant-resolution
contract between the three frontends, the gateway, and the backend, and the concrete
isolation fixes required in the existing multitenancy and security code.

## Current state — observed

| Mechanism | Behavior today | File |
|---|---|---|
| Sign-in | Tenant user authenticates with **email + password on the tenant host**; `User.email` is unique within the tenant schema (BR-001) | `../../backend/src/main/java/com/elanjaibuildos/backend/service/AuthService.java`, `../../backend/src/main/java/com/elanjaibuildos/backend/controller/AuthenticationController.java` |
| Tenant resolution | `TenantResolutionFilter` sets `TenantContext` from the **raw `Host` header** (`<slug>.<base>`) — it does **not** read `X-Forwarded-Host` — or from the `X-Tenant-ID` header when the dev flag is on. `TENANT_DEV_HEADER` currently defaults `true` in `application.properties` | `../../backend/src/main/java/com/elanjaibuildos/backend/common/web/TenantResolutionFilter.java`, `../../backend/src/main/resources/application.properties` |
| Token↔tenant binding | `JwtAuthenticationFilter` rejects a tenant-realm token whose tenant claim mismatches the resolved tenant; platform vs tenant realms are distinct JWTs | `../../backend/src/main/java/com/elanjaibuildos/backend/security/JwtAuthenticationFilter.java` |
| Authorization gap | `SecurityConfiguration` guards `/api/admin/**` by role and **all other paths by `anyRequest().authenticated()`**; `JwtAuthenticationFilter` authenticates a platform JWT even on tenant paths — so a platform token may currently reach tenant endpoints without any `TenantContext`. Realm/path enforcement is **not guaranteed today**; it is P0 work below | `../../backend/src/main/java/com/elanjaibuildos/backend/security/SecurityConfiguration.java`, `../../backend/src/main/java/com/elanjaibuildos/backend/security/JwtAuthenticationFilter.java` |
| DB isolation | `SchemaMultiTenantConnectionProvider` runs `SET search_path TO <schema>, public` per connection and `SET search_path TO public` on release; identifier is concatenated **unquoted** into the SQL (in-code comment claims `^t_[a-z0-9-]+$` validation) | `../../backend/src/main/java/com/elanjaibuildos/backend/common/multitenancy/SchemaMultiTenantConnectionProvider.java` |
| Schema naming | `TenantSchemaProvisioner.schemaFor(slug)` → `t_<slug>`; slug rules permit hyphens (BR-001: 3–30 lowercase alnum+hyphen) | `../../backend/src/main/java/com/elanjaibuildos/backend/common/multitenancy/TenantSchemaProvisioner.java` |
| Lifecycle | Login only in TRIAL/ACTIVE/GRACE; trial 14d; grace 7d read-only; suspended → no login (BRs) | `../../backend/src/main/java/com/elanjaibuildos/backend/common/web/TenantLifecycleGuardFilter.java`, `platform/service/TenantLifecycleService.java` |
| Client hints | `?tenant=` param and `localStorage tenant_slug`/`admin_console` overrides | `../../src/lib/tenant.ts` |

### Known defects to fix (Phase A scope)

1. **Unquoted schema identifier.** `SET search_path TO t_<slug>, public` breaks or
   misbehaves for hyphenated slugs (`t_my-shop` parses `-` as subtraction → SQL error
   at best). Either every hyphenated tenant fails at runtime, or provisioning must be
   rejecting them silently — either way the identifier must be quoted and the slug
   regex validated again at the point of use, not trusted from upstream.
2. **Reset on release must be exception-proof.** If `SET search_path TO public` is not
   executed inside a guaranteed path (try/finally covering every checkout/return), a
   pooled connection can be returned still scoped to a tenant — a cross-tenant data
   leak on the next borrower. Verify `releaseConnection`/`getConnection` pairs and the
   `HibernateMultiTenancyConfig` wiring; add tests that throw mid-transaction and then
   re-borrow the same pooled connection.
3. **Realm enforcement is incomplete.** `/api/admin/**` is role-guarded but every
   other endpoint only requires *some* authenticated principal, and the platform JWT
   authenticates on tenant paths without a `TenantContext`. Required: tenant
   endpoints demand a tenant-realm token **and** a bound `TenantContext` (fail closed
   when no tenant resolves); platform-realm tokens are valid only on admin/platform
   paths. Plus a negative integration test per realm-crossing direction.
4. **`TENANT_DEV_HEADER` defaults `true` in `application.properties`** — the dev
   header path is effectively on by default. Required: default `false` / fail closed,
   with `true` only in dev compose (`../../docker-compose.yml` already sets it for
   dev); production must never honor `X-Tenant-ID`.

## Target design — recommended

### Identity model

- **Email** remains the delivery contact and stays unique per tenant schema (BR-001).
- **Username** is an **additive nullable column** on the tenant `User`, and the
  **canonical sign-in identifier for all new tenant users**: full form
  `<local>@<slug>` (e.g. `sanjay@acme`), where `<slug>` is the existing tenant slug —
  the same identifier used in `t_<slug>` and `<slug>.<base>`. Not "optional
  indefinitely": new accounts get a username at creation; only pre-existing rows may
  hold `NULL` until backfilled.
- `<local>` rules: lowercase-normalized, starts alnum, allows `[a-z0-9._-]`, length
  ≤ 64; the full username ≤ 100 chars, stored lowercase. Unique within the tenant
  schema via a unique constraint on `username` (the table itself is per-tenant).
  Column type: `varchar(100) NULL` — do **not** use `citext` (extension not present);
  enforce case by normalizing to lowercase in code and migration.
- The suffix after `@` **must equal the tenant slug** of the schema the user lives
  in. Store the canonical full form `<local>@<slug>` for portability of exports.
- Platform realm (`platform/model/PlatformUser.java`) is untouched — admins keep
  email sign-in on `admin.<base>`. No username scheme in the platform realm.

### Transition and backfill

- Existing accounts keep working: **email + tenant host** sign-in stays valid through
  the transition until migration/cutover completes; rows may remain `NULL` (or keep
  email login) where a username cannot be safely derived — no forced renames.
- Schema change is a plain additive tenant-track migration: `ALTER TABLE users ADD
  COLUMN username varchar(100) NULL` + unique constraint. Flyway SQL runs per schema
  and cannot know the tenant's slug, so **backfill is a controlled per-tenant job**
  (Java-side, run per tenant with the slug in hand — e.g. an admin-triggered or
  startup-queued `UsernameBackfillService` over each `t_<slug>`), not a hand-waved
  SQL V-next.
- Backfill rules: derive `<local>` from the email local-part (sanitize/translate
  invalid chars); process rows in a **deterministic order** (e.g. by id/created_at);
  if a derived candidate equals **any** stored email or an already-assigned username
  in the schema — including the row's own email — **skip** it: leave `username`
  `NULL`, flag for review, and count it in the report (unsanitizable rows are
  skipped the same way). Write each assignment to the platform audit log and emit a
  per-tenant status report (assigned/skipped/flagged counts). Idempotent: never
  overwrite a non-NULL username; re-running the job is a no-op.

### Sign-in resolution contract

| Input | Where handled | Rule |
|---|---|---|
| `POST /api/auth/login` body `{ identifier, password }` on `acme.<base>` | tenant app → backend | Deterministic precedence: (1) exact normalized **email** lookup — legacy compat, since `user@acme` can be a real email (single-label domains are valid); (2) canonical **username** lookup. The disjointness rules below guarantee at most one match, so precedence never picks the wrong user. When the identifier is handled as a username, its `@`-suffix **must equal** the resolved host slug `acme`; mismatch → reject |
| Identifier with `@`-suffix ≠ host (`sanjay@acme` sent to `beta.<base>`) | backend | If it is a stored **email** in beta's schema → authenticates as legacy email (emails carry arbitrary domains). Otherwise, if it has canonical-username shape with a valid slug suffix ≠ `beta` → **reject before any username lookup**, no fallback. (It cannot equal a beta-schema username anyway — every username in beta's schema ends `@beta` by the canonical rule.) |
| Identifier with suffix on the **apex** (public) | landing `/login` page | parse only if it is valid username syntax whose suffix is a canonical slug (or an explicit workspace input); navigate client-side to `acme.<base>/login` carrying **no** identifiers in the URL; **no central authentication**, no credential check, no email→tenant lookup on the apex |
| Bare email on apex | landing | ask for workspace; do not scan tenants; no central email→tenant directory is added |
| `X-Tenant-ID`, `?tenant=` | dev only | honored only when `TENANT_DEV_HEADER=true`; that flag must default `false` / fail closed outside dev compose |
| `Host` (raw) | gateway → backend | `TenantResolutionFilter` reads **raw `Host`**, not `X-Forwarded-Host` — so every proxy hop must preserve the canonical external `Host` (`proxy_set_header Host $host`) and the edge strips inbound `X-Forwarded-*`/tenant headers. See [03-deployment/01](../03-deployment/01-independent-delivery.md) |

**Identifier disjointness (why precedence is safe).** Within one tenant schema, the
sets of emails and usernames are strictly disjoint — enforced at write time in both
directions, including self-collisions:

- Reject a username assignment/creation whose canonical candidate equals **any**
  stored email in the same schema — including the same user's own email.
- Reject a new/changed email that equals **any** stored username in the same schema —
  including the same user's.
- During backfill, if a derived candidate collides with **any** stored email or
  username, skip it: leave `username` `NULL` and flag the row for review — an
  ambiguous identifier must never authenticate anyone.

With disjointness guaranteed, "email first, then username" matches at most one user
and legacy `user@<slug>` emails keep working on their tenant host indefinitely.

**Authoritative chain for a tenant request:** canonical external `Host` (preserved
through gateway + app proxy, and the production backend is reachable **only** through
that trusted edge — otherwise arbitrary `Host` spoofing is possible) →
`TenantResolutionFilter` → `TenantContext` → `JwtAuthenticationFilter` requires a
tenant-realm token whose tenant claim equals the context (fail closed when no tenant
resolves) → lifecycle guard → the user row inside that tenant's schema →
`search_path`. No link in that chain may be satisfied by a suffix in the request
body, a query param, or a client header alone — and there is no public membership
directory; per-schema user status + token/host binding are the whole model.

### What we do **not** take from the reference

- In the reference, `tenantCode` **is** the slug (canonical 3–10 chars, schema
  `tenant_<code>`); BuildOS keeps its own slug rules (3–30) and `t_<slug>` naming.
- Reference `TenantResolver` authorizes via `public`-schema **membership** tables so
  a user can hold memberships in multiple tenants. BuildOS has no such membership
  model and this design adds none: a user's status lives inside their tenant schema
  and authorization comes from token↔host binding plus that row. Do not introduce a
  public membership directory.

## Phased tasks

**Phase A (P0 — with frontend extraction):**

- [ ] Quote schema identifiers: `SET search_path TO "<schema>", public` (or equivalent
  safe quoting) and re-validate `^t_[a-z0-9-]+$` in `SchemaMultiTenantConnectionProvider`
  before executing — fail closed on any other shape.
- [ ] Make connection reset exception-proof: verify/guarantee `search_path` reset runs
  on every return path; add a regression test that throws inside a tenant transaction,
  returns the connection to the pool, re-borrows it, and asserts `search_path = public`.
- [ ] **Realm/path/tenant-context enforcement** in `SecurityConfiguration` +
  `JwtAuthenticationFilter`: tenant endpoints require a tenant-realm token and a bound
  `TenantContext` (fail closed when none resolves); platform-realm tokens valid only
  on `/api/admin/**` / platform paths. Negative integration tests both directions.
- [ ] `TENANT_DEV_HEADER`: default `false` / fail closed in
  `application.properties`; `true` only via dev compose env; production gateway/edge
  strips client-supplied `X-Tenant-ID` and `X-Forwarded-*` headers.
- [ ] Integration tests per [verification matrix](../04-quality/02-verification-matrix.md):
  cross-tenant isolation, realm isolation (both directions, including platform token
  on tenant path), hyphenated-slug end-to-end, no-tenant fail-closed.
- [ ] Narrow CORS in `SecurityConfiguration` to the three known origins + dev ports.
- [ ] Add the public workspace-status endpoint (existence + lifecycle-safe status
  only) that the tenant app's `/workspace-not-found` guard calls for unknown slugs.

**Phase B (P1 — with backend reorg):**

- [ ] `db/migration-tenant` V-next: `ALTER TABLE users ADD COLUMN username
  varchar(100) NULL` + unique constraint — additive only, nothing dropped
  (expand/contract).
- [ ] Controlled per-tenant backfill job (Java-side, slug-aware; deterministic row
  order; collisions skipped → `NULL` + flagged; audit + per-tenant status report;
  never overwrites non-NULL) — run per tenant after the column lands, not as a blind
  SQL migration.
- [ ] `AuthService`: accept `identifier` = email | `<local>` | `<local>@<slug>` with
  the precedence rules above (exact normalized email first, then canonical username);
  a canonical-username shape whose slug ≠ `TenantContext` is rejected **before** the
  username lookup — no email fallback after a username match attempt;
  constant-time-ish error surface (no "user not found" vs "bad password" oracle
  beyond what exists today).
- [ ] Enforce identifier disjointness at write time in **both** directions,
  including self-collisions: username candidates equal to any stored email → reject;
  email candidates equal to any stored username → reject; backfill skips colliding
  candidates → `NULL` + flagged for review.
- [ ] New tenant users always get a canonical `<local>@<slug>` username at creation
  (owner provisioning, invites, admin user-create).
- [ ] Tenant app login UI: identifier field + hint text; email+host path unchanged.
- [ ] Admin user-management: allow setting/resetting a user's username with collision
  validation.

## Acceptance criteria

- [ ] Sign-in works with email (existing — incl. legacy `user@<slug>` emails),
  `<local>` (new), and `<local>@<slug>` (new, canonical for newly created users);
  email lookup runs first; a canonical-username shape with slug ≠ resolved tenant is
  rejected before username lookup with no fallback; an identifier equal to a stored
  email is never treated as a username.
- [ ] **Realm enforcement verified**: platform token on a tenant endpoint → rejected;
  tenant token on `/api/admin/**` → rejected; request on a tenant path with no
  resolvable tenant → rejected (fail closed). Negative tests in CI.
- [ ] A tenant `acme-shop` (hyphenated) can be provisioned, log in, and run queries —
  proves quoting fix end-to-end.
- [ ] Pooled-connection test: exception mid-transaction → next borrowed connection has
  `search_path = public`.
- [ ] Production-mode backend ignores `X-Tenant-ID` (`TENANT_DEV_HEADER` defaults off);
  the canonical `Host` preserved through the trusted edge is the only tenant signal,
  and the backend is not directly reachable outside that edge.
- [ ] Backfill job is idempotent and per-tenant: re-run changes nothing; colliding
  candidates are skipped (`NULL` + flagged) in deterministic order; audit + status
  report produced; no existing username overwritten; no forced renames; ambiguous
  identifiers never authenticate.
- [ ] No authorization decision anywhere uses only a URL suffix, `?tenant=`, or
  `X-Tenant-ID`; no public membership directory is introduced.

## Risks & dependencies

| Risk | Mitigation |
|---|---|
| Quoting fix reveals hyphenated tenants were silently broken before | Treat as found-bug: provision a hyphenated test tenant first thing; document behavior change |
| Backfill collision surprises (many users share local-part, or email == derived username) | Collisions stay within one schema only; skip → `NULL` + flag + audit/report; users can be assigned a username later |
| Email ambiguity: same email in two tenants is already allowed by design (unique per schema) | Resolution is always host-scoped; apex never authenticates — contract above |
| Username becomes a cross-tenant enumeration vector on apex `/login` | Apex only parses canonical-username syntax and navigates — no auth, no tenant lookup; backend returns uniform errors; rate-limit auth endpoints (bucket4j already in stack per `../../requirement.md`) |
| Email parsed as username (`user@mail.com` treated as `mail.com` suffix) | Precedence + disjointness: exact email lookup runs first, so any stored email is never treated as a username; a canonical-username shape with slug ≠ resolved tenant is rejected before the username lookup with no fallback |
| `Host` spoofing past the edge | Backend reachable only via trusted edge in prod; edge preserves canonical `Host` and strips client `X-Forwarded-*`; suffix-match rule double-checks |
| Reference-style membership model creeps in | Explicitly out of scope — see "What we do not take" |

## Dependencies

- Frontend split ([01-architecture/02](../01-architecture/02-frontend-extraction.md))
  for per-app login pages and token isolation.
- Gateway/host forwarding rules
  ([03-deployment/01](../03-deployment/01-independent-delivery.md)) for the spoof-proof
  host chain.
- No backend test suite exists today — tests listed here are net-new and part of the
  P0 scope, not optional.
