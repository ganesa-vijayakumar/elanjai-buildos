# 02 — Tenant Provisioning and Migrations

[← Roadmap](../README.md) · Prev: [01 — Identity and Isolation](01-identity-and-isolation.md)

## Purpose

Turn today's synchronous "approve → provision" path into a stepwise, idempotent,
compensatable pipeline — without over-building: adopt a durable operation table only
if basic idempotency proves insufficient after the frontend split.

## Current state — observed

- `SignupService.approve` (platform plane) approves a `SignupRequest`, calls
  `TenantSchemaProvisioner.provision(slug)` which `CREATE SCHEMA t_<slug>` and runs the
  tenant Flyway track, then creates the owner user and starts the 14-day trial. The
  provisioner already probes schema existence before migrating — a **partial**
  probe; keep it, but the rest of the approve path (Tenant reservation, owner create,
  lifecycle activation) is not idempotent today.
  - `../../backend/src/main/java/com/elanjaibuildos/backend/platform/service/SignupService.java`
  - `../../backend/src/main/java/com/elanjaibuildos/backend/common/multitenancy/TenantSchemaProvisioner.java`
- Flyway is dual-track:
  - `../../backend/src/main/resources/db/migration/` — `public` schema
    (`V1__public_schema.sql`, `V2__invoice_plan.sql`)
  - `../../backend/src/main/resources/db/migration-tenant/` — applied per `t_<slug>`
    (`V1__tenant_schema.sql`, `V2__tenant_seed.sql`, `V3__s2.sql`,
    `V4__approval_status_case.sql`)
- `spring.jpa.hibernate.ddl-auto=none` in
  `../../backend/src/main/resources/application.properties` (~line 16) — schema comes
  only from Flyway. `../../requirement.md` *prefers* `validate`, but the
  implementation uses `none`; adopting `validate` is an optional explicit later
  target, not current state.
- `TenantLifecycleService` + `TenantLifecycleGuardFilter` enforce
  TRIAL/ACTIVE/GRACE/SUSPENDED (login blocked outside allowed states; grace is
  read-only per BRs).
- `platform/model/` already has the registry rows: `Tenant`, `Plan`, `Subscription`,
  `Invoice`, `SignupRequest`, `PlatformUser`, `PlatformAuditLog`,
  `ProcessedWebhookEvent`, `UsageCounter`, `TenantNotification`.
- Reference comparison: `ProvisionTenantOperation` + `DurableOperationRunner` in
  `elanjai-office-pro` persist step state so provisioning can resume/compensate after
  a crash. Ours is synchronous today — a crash mid-provision leaves a half-made
  schema with no record of which step failed.

## Failure modes to design for

| Failure | Today's outcome | Required outcome |
|---|---|---|
| Crash after `CREATE SCHEMA`, before Flyway | orphan empty schema + registry inconsistency | resume at the migrate step, or compensate (drop the **new, never-activated** schema) |
| Flyway failure mid-tenant-migration | partial schema, `flyway_schema_history` marks failure | operation marked FAILED with step detail; retry resumes; `flyway repair` only as operator action |
| Crash after schema ready, before owner row | tenant exists but unusable | resume creates owner |
| Approve clicked twice / retried | depends on unique constraints — possibly 500s | idempotent: second call returns existing result |
| Compensation path runs on a live tenant | (no compensation exists) | **must never drop an existing or ACTIVE tenant schema** |

## Target design — recommended

### Stepwise pipeline

Model provisioning as ordered, individually idempotent steps. Each step is safe to
re-run (checks current state first):

1. **Validate + reserve** — slug syntax (3–30, lowercase alnum+hyphen, blocklist,
   immutable per BR-001), duplicate-pending-signup rejection (BR), insert `Tenant`
   row in `public` with status `PROVISIONING`.
2. **Create schema** — `CREATE SCHEMA IF NOT EXISTS "t_<slug>"` (quoted identifier per
   [identity doc](01-identity-and-isolation.md)).
3. **Migrate schema** — run tenant Flyway track against `t_<slug>` only.
4. **Seed** — default masters/settings rows the tenant app expects.
5. **Create owner** — owner user (+ username if provided) inside the tenant schema.
6. **Activate lifecycle** — status → `TRIAL`, trial window opens (14d per BR).
7. **Notify** — approval/credentials email via `PlatformMailService`.

Steps 2–6 record progress. Two acceptable mechanisms, in order of preference:

- **Basic (default for the first implementation):** make every step idempotent and
  derive progress by probing state (does `Tenant` exist? does schema exist? is
  `flyway_schema_history` present and clean? does owner exist?). Retry = re-run the
  pipeline; it fast-forwards to the first incomplete step.
- **Durable operation state (only if justified):** a `public.tenant_operation`
  (name TBD) table — `(id, tenant_id, type, step, status, payload_json, attempts,
  last_error, created_at, updated_at)` — with a runner that resumes incomplete
  operations on startup/admin retry. This is the reference `DurableOperationRunner`
  pattern. Adopt only if basic probing proves fragile (e.g. seed step is expensive or
  externally visible states need auditing) — that decision belongs to the Phase B
  implementer, with the justification recorded in the PR.

### Compensation rules

- Compensation applies only to a tenant still in `PROVISIONING`/`FAILED` — never to
  `TRIAL`, `ACTIVE`, `GRACE`, or `SUSPENDED`.
- Dropping the schema is allowed **only** for the schema this operation created, and
  only if it was never activated. Everything else is marked `FAILED` and left for
  operators.
- Never emit `DROP SCHEMA` for an existing/active tenant — this is a hard guard:
  assert lifecycle state inside the compensation code path, not just at call sites.

### Migration policy (both tracks)

- **Expand/contract only**: add columns/tables → backfill → switch reads → drop in a
  later migration. No in-place destructive changes.
- **Backup before any destructive schema change** — `pg_dump` of the affected
  schema(s) (or full DB for `public` changes) is a required pre-step in the rollout
  runbook ([03-deployment/02](../03-deployment/02-rollout-and-rollback.md)).
- Public track changes deploy with the backend release; tenant track changes roll
  forward across all `t_<slug>` schemas — run the per-schema migrate loop with
  per-tenant failure isolation (one tenant's failure must not block the loop or mark
  others failed).
- New-tenant provisioning always runs the **latest** tenant track — no tenant is born
  at an old version.

## Phased tasks

**Phase A (P0, minimal — alongside frontend split):**

- [ ] Make `SignupService.approve` idempotent end-to-end on duplicate approve of the
  same request (E1): keep the provisioner's existing schema-existence probe and
  extend idempotency to the whole path (Tenant row reserve, owner create, lifecycle
  activation) — not just `CREATE SCHEMA IF NOT EXISTS`.
- [ ] Drop-guard: any code path capable of `DROP SCHEMA` asserts the tenant is not in
  a live lifecycle state (TRIAL/ACTIVE/GRACE/SUSPENDED) — this is a guard only;
  Phase A does **not** add an auto-compensation flow or promise resume between steps.
- [ ] Quote the schema identifier everywhere SQL is built (provisioner + connection
  provider — shared fix with [identity doc](01-identity-and-isolation.md)).
- [ ] P0 tests only: double-approve → single tenant (E1); hyphenated slug provisions
  end-to-end (quoting); the drop-guard refuses on a live tenant schema. Crash-resume
  and compensation tests are Phase B.

**Phase B (P1):**

- [ ] Split `approve` into the stepwise pipeline above (still synchronous is fine;
  async via durable runner only if justified — record the decision). This is where
  resume-between-steps (E2) is delivered and tested.
- [ ] If a compensation path is introduced, it carries the E3 negative guard:
  refuses for any tenant not in `PROVISIONING`/`FAILED` and drops only a schema that
  this operation created and never activated.
- [ ] If durable state adopted: `db/migration` V-next creates the operation table;
  runner resumes on startup; admin console gets a retry/view affordance.
- [ ] Per-schema migrate runner for tenant-track upgrades with per-tenant failure
  isolation and a report of succeeded/failed schemas.
- [ ] Lifecycle transitions (trial→active, →grace, →suspend) stay in
  `TenantLifecycleService`; provisioning must not bypass them.

## Acceptance criteria

- [ ] **(Phase A)** Provisioning approve is idempotent: repeat `approve` → one
  tenant, one schema, one owner (E1).
- [ ] **(Phase B)** A crash simulated between pipeline steps is resumable by
  re-running the pipeline (or the operation runner, if adopted) — no manual SQL
  needed (E2).
- [ ] **(Phase B, whenever compensation exists)** Compensation may remove a failed
  PROVISIONING tenant's schema but **cannot** drop a
  TRIAL/ACTIVE/GRACE/SUSPENDED tenant — negative test required (E3).
- [ ] Tenant-track migration applies to all existing schemas; one failing schema
  doesn't abort the rest; report surfaces failures.
- [ ] Hyphenated slug (`acme-shop`) provisions cleanly — proves identifier quoting.
- [ ] Backups taken before destructive changes are restorable (drill once per release
  process, see rollout doc).

## Risks & dependencies

| Risk | Mitigation |
|---|---|
| Long Flyway runs per tenant slow mass-migration | Per-schema loop with isolation + report; batch/parallelize only if measured need |
| `flyway_schema_history` divergence between tenants | Report schemas whose version ≠ latest; reconcile as operator task |
| Over-engineering the durable runner before it's needed | Decision gate documented above; basic idempotency is the Phase A bar |
| Compensation accidentally dropping real tenant | Hard guard on lifecycle status + negative test in acceptance |
| Schema name collisions on retry | `CREATE SCHEMA IF NOT EXISTS` + `Tenant` row is the reservation of record |

## Dependencies

- Identifier quoting + reset fixes from
  [identity doc](01-identity-and-isolation.md) (shared edits in `common/multitenancy/`).
- Admin console surface for operation status (if durable runner adopted) —
  `frontend-admin` from Phase A.
- Backup procedure from [03-deployment/02](../03-deployment/02-rollout-and-rollback.md).
