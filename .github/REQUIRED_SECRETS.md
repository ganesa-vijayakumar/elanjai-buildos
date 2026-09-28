# Required GitHub Secrets and Variables

This document lists the secrets and configuration variables that the workflows
in `.github/workflows/` expect. Every workflow is `workflow_dispatch` only —
nothing runs automatically.

## GitHub environments

| Environment | Used by | Purpose |
|---|---|---|
| `preprod` | `promote.yml`, `rollback.yml` | Pre-production target. Currently records the approval for the rendered deploy plan; will gate the live deploy step when a target is wired. |
| `prod` | `promote.yml`, `rollback.yml` | Production target — configure required reviewers. |
| `cleanup` | `cleanup-retention.yml` apply job | Approval gate before any deletion executes. |

Environment-scoped secrets/vars (configured under each environment) take
precedence over repository-level values.

## Secrets

| Name | Scope | Used in | Purpose |
|------|-------|---------|---------|
| `GITHUB_TOKEN` | built-in | all workflows | Provided automatically; GHCR login, release-asset reads/writes, cleanup enumeration. |
| `NVD_API_KEY` | repository (optional) | `release.yml` (`run_security`) | Speeds up OWASP Dependency-Check; without it NVD access is unauthenticated and may be rate limited. |
| `CLEANUP_GH_TOKEN` | environment `cleanup` (optional) | `cleanup-retention.yml` apply | PAT with `delete:packages` + `read:packages`. `GITHUB_TOKEN` cannot delete GHCR package versions on all account types; when unset the workflow falls back to `GITHUB_TOKEN` and package deletion may fail (caches and runs still delete). |

## Configuration variables (non-sensitive)

| Name | Scope | Used in | Purpose |
|------|-------|---------|---------|
| `ALLOWED_TEST_HOSTS` | repository | `release.yml` | Comma-separated host allowlist (e.g. `preprod.example.com`). Required only when `run_load_test` is selected; `test_target_url` must be `https://` and its host must match an entry. The k6 smoke also probes `admin.<host>` and `<tenant-slug>.<host>`, so wildcard DNS must resolve on the target. `run_e2e` tests a local Compose deployment and does not consume it. |

## Registry-side configuration (not repo secrets)

Target hosts pull images from `ghcr.io`, which is a private registry for this
repository. Configure a registry credential on each deploy host (`docker login
ghcr.io` with a PAT that has `read:packages`) so it can pull
`ghcr.io/ganesa-vijayakumar/buildos-{landing,tenant,admin,backend}` digests.
PostgreSQL runs as the stock `postgres:16-alpine` image — it is not part of
the release manifest.

## Setting up

1. Go to **Settings → Secrets and variables → Actions** in the GitHub repository.
2. Add each secret above under **Repository secrets**.
3. Add non-sensitive configuration values under **Variables** where appropriate.
4. Create the `preprod`, `prod`, and `cleanup` environments under
   **Settings → Environments**, add the environment-scoped secrets/vars there,
   and configure required reviewers on `prod` and `cleanup` where the GitHub
   plan supports them. On a private repository without environment reviewers,
   restrict repository write access to the operators allowed to dispatch these
   workflows and document that control.
5. Keep `main` protected; the release-management workflows refuse
   `workflow_dispatch` from other refs, so reviewed workflow code must merge
   before it can release, deploy, or clean up.

## Notes

- Promotion/rollback never trust a mutable tag: they download
  `manifest.json` + `checksums.txt` from the published GitHub release
  `v<version>` and render the `image@sha256:…` references verbatim into
  `images.env` (`BUILDOS_*_IMAGE`, consumed by `docker-compose.yml`).
- Enable **immutable releases** in repository settings when supported so that
  published manifest/checksum assets cannot be replaced.
