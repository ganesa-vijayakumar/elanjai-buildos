# GitHub Actions Workflows

Every workflow in this repository is manual-only (`workflow_dispatch`) — no
push, pull_request, schedule, workflow_call, or other automatic triggers exist.
The four release-management workflows must be dispatched from `main`;
validation fails on any other ref. The five per-component build checks may be
dispatched from any ref.

## Release management

| Workflow | Purpose |
|----------|---------|
| `release.yml` | Resolve `source_ref` → commit, run the selected release checks, build + push the four images (`buildos-landing`, `buildos-tenant`, `buildos-admin`, `buildos-backend`) with immutable version tags, and publish `manifest.json` + `checksums.txt` + evidence as assets on GitHub release `v<version>` |
| `promote.yml` | Download + verify the release manifest and render the pinned `images.env` digest set + `deploy-plan.md` for the target environment (`preprod`/`prod`), service `all`/`landing`/`tenant`/`admin`/`backend` |
| `rollback.yml` | Restore a prior release's manifest digests after a schema-compatibility attestation and typed confirmation |
| `cleanup-retention.yml` | Enumerate (always) then optionally delete old GHCR versions, stale Actions caches, and old non-success runs — protected by the `cleanup` environment |

## Manual build checks

| Workflow | Purpose |
|----------|---------|
| `backend.yml` | `mvn -B verify` (unit + integration tests against a postgres service) + Docker build-only |
| `landing.yml` | `npm ci` + `npm run build -w @buildos/landing` + Docker build-only |
| `tenant.yml` | `npm ci` + `npm run build -w @buildos/tenant` + Docker build-only |
| `admin.yml` | `npm ci` + `npm run build -w @buildos/admin` + Docker build-only |
| `docs.yml` | Markdown link + whitespace hygiene checks |

## How they interoperate

1. **`release.yml`** is the only way images are published. Inputs
   `run_validation`, `run_security`, `run_e2e`, `run_load_test`, and
   `run_backup_restore` gate optional checks; `confirm_publish=publish`
   requires all five, `publish-skip-checks` records the skips in the release
   evidence. It creates a **draft** release `v<version>` at the resolved
   commit, attaches `manifest.json` (version, commit, created, and the four
   `images.<role>` digest references), `checksums.txt`, and
   `release-evidence-*` artifacts, then publishes it.
2. **`promote.yml`** and **`rollback.yml`** download `manifest.json` +
   `checksums.txt` from the published release, verify the checksum, validate
   version/commit/schema, and render the pinned digest set via
   `scripts/deploy-manifest.sh` (deploy order for `all`: backend → landing →
   admin → tenant; postgres is a stock image, not part of the manifest). The
   output is `images.env` (`BUILDOS_*_IMAGE=<image>@sha256:…`, consumed by
   `docker-compose.yml`) plus `deploy-plan.md` with the exact pull/up commands
   — no live target is wired to CI yet. Both jobs run inside
   `environment: <preprod|prod>` and share the `deployment-<environment>`
   concurrency group so they serialize.
3. **`cleanup-retention.yml`** protects every digest referenced by any
   published release manifest plus any operator-supplied `protected_digests` —
   promotion history is never garbage-collected out from under a rollback.
   `dry_run=true` + `confirm_cleanup=preview` enumerates only;
   `dry_run=false` + `confirm_cleanup=cleanup` applies the uploaded plan inside
   the protected `cleanup` environment.

## Required secrets and variables

See `.github/REQUIRED_SECRETS.md` — the `preprod`/`prod`/`cleanup`
environments, `ALLOWED_TEST_HOSTS` for the `run_load_test` target, the
optional `NVD_API_KEY` for faster OWASP scans, and the optional
`CLEANUP_GH_TOKEN` PAT for package deletion.

## Notes

- Image tags are immutable `:<version>` — nothing publishes or deploys
  `latest`.
- Manifests are **not** signed and no artifact attestation is claimed; enable
  **immutable releases** in repository settings when supported so published
  assets cannot be replaced.
- Local dry-run helpers: `scripts/deploy-manifest.sh --dry-run` and
  `scripts/cleanup-github-resources.sh --plan`.
