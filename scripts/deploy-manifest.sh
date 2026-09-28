#!/usr/bin/env bash
set -euo pipefail

# scripts/deploy-manifest.sh
#
# Shared deploy adapter used by .github/workflows/promote.yml and
# .github/workflows/rollback.yml. It resolves the @sha256 image digests
# recorded in a release manifest into a pinned Compose env file plus a human
# deploy plan — the manifest is deployment identity; mutable tags are never
# deployed.
#
# This project has no live deploy target wired to CI yet (the target topology
# is host-class compose — see Prody enhancements/03-deployment). The script
# therefore *renders* the pinned image set and the exact commands to apply it
# on the target host; nothing is deployed from GitHub Actions. When a real
# target is configured, the apply step belongs inside the same protected
# GitHub environment gate.
#
# Usage:
#   scripts/deploy-manifest.sh \
#     --manifest <path-to-manifest.json> \
#     --environment <preprod|prod> \
#     --service <all|landing|tenant|admin|backend> \
#     --mode <promote|rollback> \
#     [--expected-version <semver>] \
#     [--out-dir <dir>] \
#     [--dry-run]
#
# Outputs (written to --out-dir, default ./deploy-out):
#   images.env      BUILDOS_<ROLE>_IMAGE=<image>@sha256:... lines for the
#                   selected roles — consumed verbatim by docker-compose.yml.
#   deploy-plan.md  Version/commit/environment/mode, the digest pins, and the
#                   exact pull/up commands for the target host.
#
# --dry-run validates the manifest and inputs and prints the intended output
# without writing files — for local smoke tests:
#
#   scripts/deploy-manifest.sh --manifest manifest.json \
#     --environment preprod --service all --mode promote --dry-run

MANIFEST=""
ENVIRONMENT=""
SERVICE=""
MODE=""
EXPECTED_VERSION=""
OUT_DIR="deploy-out"
DRY_RUN=0

usage() {
  sed -n '2,45p' "$0" | sed 's/^# \{0,1\}//'
  exit "${1:-1}"
}

while [ $# -gt 0 ]; do
  case "$1" in
    --manifest)          MANIFEST="$2"; shift ;;
    --environment)       ENVIRONMENT="$2"; shift ;;
    --service)           SERVICE="$2"; shift ;;
    --mode)              MODE="$2"; shift ;;
    --expected-version)  EXPECTED_VERSION="$2"; shift ;;
    --out-dir)           OUT_DIR="$2"; shift ;;
    --dry-run)           DRY_RUN=1 ;;
    -h|--help)           usage 0 ;;
    *) echo "Unknown option: $1"; usage ;;
  esac
  shift
done

log()  { echo "[deploy] $*"; }
fail() { echo "[deploy] ERROR: $*" >&2; exit 1; }

command -v jq >/dev/null 2>&1 || fail "jq is required"

# ── Input validation (fail closed) ────────────────────────────────────────────
[ -n "$MANIFEST" ]    || fail "--manifest is required"
[ -f "$MANIFEST" ]    || fail "manifest file not found: $MANIFEST"
case "$ENVIRONMENT" in preprod|prod) ;; *) fail "--environment must be preprod or prod" ;; esac
case "$SERVICE" in     all|landing|tenant|admin|backend) ;; *) fail "--service must be all|landing|tenant|admin|backend" ;; esac
case "$MODE" in        promote|rollback) ;; *) fail "--mode must be promote or rollback" ;; esac

# ── Manifest validation ───────────────────────────────────────────────────────
jq empty "$MANIFEST" 2>/dev/null || fail "manifest is not valid JSON"

M_VERSION=$(jq -r '.version // empty' "$MANIFEST")
M_COMMIT=$(jq -r '.commit // empty' "$MANIFEST")
M_CREATED=$(jq -r '.created // empty' "$MANIFEST")
[ -n "$M_VERSION" ] || fail "manifest missing .version"
[ -n "$M_COMMIT" ]  || fail "manifest missing .commit"
[ -n "$M_CREATED" ] || fail "manifest missing .created"
[[ "$M_COMMIT" =~ ^[0-9a-f]{40}$ ]] || fail "manifest .commit is not a 40-hex SHA: $M_COMMIT"
if [ -n "$EXPECTED_VERSION" ] && [ "$M_VERSION" != "$EXPECTED_VERSION" ]; then
  fail "manifest version $M_VERSION does not match requested $EXPECTED_VERSION"
fi

# Deployment roles and their expected image names / compose env vars.
# Deploy order for `all`: backend first (apps depend on it), then the edges.
DEPLOY_ORDER="backend landing admin tenant"

declare -A EXPECTED_IMAGE=(
  [landing]=buildos-landing
  [tenant]=buildos-tenant
  [admin]=buildos-admin
  [backend]=buildos-backend
)
declare -A ENV_VAR=(
  [landing]=BUILDOS_LANDING_IMAGE
  [tenant]=BUILDOS_TENANT_IMAGE
  [admin]=BUILDOS_ADMIN_IMAGE
  [backend]=BUILDOS_BACKEND_IMAGE
)
declare -A IMAGE_REF=()

REF_RE='^ghcr\.io/[a-z0-9._-]+/[a-z0-9._-]+@sha256:[0-9a-f]{64}$'
EXPECTED_OWNER=""
if [ -n "${GITHUB_REPOSITORY:-}" ]; then
  EXPECTED_OWNER=$(printf '%s' "${GITHUB_REPOSITORY%%/*}" | tr 'A-Z' 'a-z')
fi
for role in landing tenant admin backend; do
  ref=$(jq -r --arg r "$role" '.images[$r] // empty' "$MANIFEST")
  [ -n "$ref" ] || fail "manifest missing .images.$role"
  [[ "$ref" =~ $REF_RE ]] || fail "manifest .images.$role is not an image@sha256 reference: $ref"
  [[ "$ref" == */"${EXPECTED_IMAGE[$role]}"@sha256:* ]] \
    || fail "manifest .images.$role does not reference ${EXPECTED_IMAGE[$role]}: $ref"
  if [ -n "$EXPECTED_OWNER" ]; then
    [[ "$ref" == "ghcr.io/${EXPECTED_OWNER}/"* ]] \
      || fail "manifest .images.$role is outside expected GHCR namespace $EXPECTED_OWNER: $ref"
  fi
  IMAGE_REF[$role]="$ref"
done

if [ "$SERVICE" = "all" ]; then
  SELECTED="$DEPLOY_ORDER"
else
  SELECTED="$SERVICE"
fi

log "mode=$MODE environment=$ENVIRONMENT (no live target — rendering pinned image set)"
log "manifest: version=$M_VERSION commit=${M_COMMIT:0:12} created=$M_CREATED"
log "services selected: $SELECTED"

# ── Render pinned images.env + deploy plan ────────────────────────────────────
ENV_LINES=""
PLAN_ROWS=""
SERVICES_CSV=""
for role in $SELECTED; do
  ref="${IMAGE_REF[$role]}"
  ENV_LINES+="${ENV_VAR[$role]}=${ref}"$'\n'
  PLAN_ROWS+="| \`$role\` | \`${ref}\` |"$'\n'
  SERVICES_CSV+="$role "
done
SERVICES_CSV="${SERVICES_CSV% }"

if [ "$DRY_RUN" = "1" ]; then
  log "── dry-run output ──"
  printf '%s' "$ENV_LINES"
  for role in $SELECTED; do
    log "   [dry-run] target host: docker compose pull $role && docker compose up -d $role"
  done
  log "$MODE plan validated for version $M_VERSION on $ENVIRONMENT"
  exit 0
fi

mkdir -p "$OUT_DIR"
printf '%s' "$ENV_LINES" > "$OUT_DIR/images.env"

cat > "$OUT_DIR/deploy-plan.md" <<EOF
# Deploy plan — $MODE v$M_VERSION on $ENVIRONMENT

- mode: \`$MODE\`
- version: \`$M_VERSION\`
- commit: \`$M_COMMIT\`
- manifest created: \`$M_CREATED\`
- services: \`$SERVICES_CSV\`

## Pinned image digests (deployment identity — never a mutable tag)

| role | image@sha256 |
|---|---|
$PLAN_ROWS
## Apply on the target host

\`\`\`bash
# copy images.env next to docker-compose.yml on the target host, then:
docker compose --env-file images.env pull $SERVICES_CSV
docker compose --env-file images.env up -d $SERVICES_CSV
EOF

# Health verification through the gateway is part of the apply contract —
# reuse the same host-class smoke suite the release e2e check runs.
cat >> "$OUT_DIR/deploy-plan.md" <<'EOF'
# verify host-class routing + API after apply (apex on :80):
./deploy/scripts/smoke.sh http://<target-host> demo
```

Promote order for `all` is backend → landing → admin → tenant; postgres is a
stock image, not part of the release manifest. Rollback applies the same file
from the prior release — digests, not tags, so the previous image set must
still exist in GHCR (cleanup-retention.yml protects every manifest digest).
EOF

log "wrote $OUT_DIR/images.env and $OUT_DIR/deploy-plan.md"
log "$MODE plan ready for version $M_VERSION on $ENVIRONMENT"
