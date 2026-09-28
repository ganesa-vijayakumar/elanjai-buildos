#!/usr/bin/env bash
set -euo pipefail

# scripts/cleanup-github-resources.sh
#
# Conservative retention cleanup for GitHub resources used by
# .github/workflows/cleanup-retention.yml. Runs in two phases:
#
#   --plan   Enumerate candidates and write a JSON plan file. Never deletes
#            anything. Safe to run locally for an audit:
#
#              GH_TOKEN=$(gh auth token) \
#                scripts/cleanup-github-resources.sh --plan --out cleanup-plan.json
#
#   --apply --plan-file <path>
#            Execute exactly the deletions recorded in a previously generated
#            plan file. Fails closed when the plan shows that protected release
#            manifests could not be collected.
#
# What is cleaned (and what is never touched):
#   * GHCR packages buildos-{landing,tenant,admin,backend}: untagged versions
#     and tagged versions beyond --retention newest — except any digest
#     referenced by a published release manifest asset (protected).
#   * GitHub Actions caches last accessed more than 7 days ago.
#   * Workflow runs: only completed non-success runs (failure, cancelled,
#     timed_out) beyond the newest --runs-retention per workflow. Successful
#     runs are never deleted.
#   * NEVER: GitHub releases, git tags, release manifest assets, any digest
#     referenced by a published release manifest, or an operator-supplied
#     EXTRA_PROTECTED pin.
#
# Options:
#   --plan                  enumerate and write the plan (default mode)
#   --apply                 execute deletions from --plan-file
#   --retention <n>         tagged versions kept per package (default 5)
#   --runs-retention <n>    non-success runs kept per workflow (default 10)
#   --repo <owner/repo>     repository (default: derived from gh repo view)
#   --out <path>            plan output path (default cleanup-plan.json)
#   --plan-file <path>      plan to execute in --apply mode
#
# Required environment:
#   GH_TOKEN    GitHub token. Plan needs read access to releases, packages,
#               actions caches and runs. Apply additionally needs delete
#               permission for package versions, caches and runs; the workflow
#               passes a dedicated token when GITHUB_TOKEN lacks package delete.
#
# Optional environment:
#   EXTRA_PROTECTED — comma/newline-separated sha256 digests to keep in
#                     addition to all release-manifest digests.

MODE="plan"
RETENTION=5
RUNS_RETENTION=10
REPO=""
OUT="cleanup-plan.json"
PLAN_FILE=""
EXTRA_PROTECTED="${EXTRA_PROTECTED:-}"
CACHE_MAX_AGE_DAYS=7

PACKAGES="buildos-landing buildos-tenant buildos-admin buildos-backend"
NON_SUCCESS_CONCLUSIONS="failure cancelled timed_out startup_failure"

usage() {
  sed -n '2,45p' "$0" | sed 's/^# \{0,1\}//'
  exit "${1:-1}"
}

while [ $# -gt 0 ]; do
  case "$1" in
    --plan)            MODE="plan" ;;
    --apply)           MODE="apply" ;;
    --retention)       RETENTION="$2"; shift ;;
    --runs-retention)  RUNS_RETENTION="$2"; shift ;;
    --repo)            REPO="$2"; shift ;;
    --out)             OUT="$2"; shift ;;
    --plan-file)       PLAN_FILE="$2"; shift ;;
    -h|--help)         usage 0 ;;
    *) echo "Unknown option: $1"; usage ;;
  esac
  shift
done

log()  { echo "[cleanup] $*"; }
fail() { echo "[cleanup] ERROR: $*" >&2; exit 1; }

command -v gh  >/dev/null 2>&1 || fail "gh CLI is required"
command -v jq  >/dev/null 2>&1 || fail "jq is required"
[ -n "${GH_TOKEN:-}" ] || fail "GH_TOKEN is required"
[[ "$RETENTION" =~ ^[0-9]+$ ]]       || fail "--retention must be a non-negative integer"
[[ "$RUNS_RETENTION" =~ ^[0-9]+$ ]]  || fail "--runs-retention must be a non-negative integer"

if [ -z "$REPO" ]; then
  REPO=$(gh repo view --json nameWithOwner --jq '.nameWithOwner' 2>/dev/null || true)
  [ -n "$REPO" ] || fail "could not determine repository; pass --repo owner/repo"
fi
OWNER="${REPO%%/*}"

# Packages live under the owning org or user — pick the right API prefix.
OWNER_TYPE=$(gh api "repos/$REPO" --jq '.owner.type // empty' 2>/dev/null || true)
if [ "$OWNER_TYPE" = "Organization" ]; then
  PKG_BASE="/orgs/$OWNER"
else
  PKG_BASE="/users/$OWNER"
fi

# ── Apply ─────────────────────────────────────────────────────────────────────
if [ "$MODE" = "apply" ]; then
  [ -n "$PLAN_FILE" ] || fail "--apply requires --plan-file <path>"
  [ -f "$PLAN_FILE" ] || fail "plan file not found: $PLAN_FILE"
  jq empty "$PLAN_FILE" 2>/dev/null || fail "plan file is not valid JSON"

  PLAN_REPO=$(jq -r '.repo // empty' "$PLAN_FILE")
  [ "$PLAN_REPO" = "$REPO" ] || fail "plan repo ($PLAN_REPO) does not match $REPO"

  FAILED_FETCHES=$(jq -r '.protected_fetch_failed // [] | length' "$PLAN_FILE")
  if [ "$FAILED_FETCHES" -gt 0 ]; then
    jq -r '.protected_fetch_failed[]' "$PLAN_FILE" | sed 's/^/[cleanup]   failed release: /' >&2
    fail "plan could not collect every published release manifest — refusing to apply (fail closed)"
  fi

  TOTAL=$(jq -r '[ (.delete.package_versions // [] | length), (.delete.caches // [] | length), (.delete.workflow_runs // [] | length) ] | add' "$PLAN_FILE")
  log "applying plan: $TOTAL deletions"

  ERRORS=0
  while IFS= read -r row; do
    [ -n "$row" ] || continue
    pkg=$(jq -r '.package' <<<"$row")
    vid=$(jq -r '.id' <<<"$row")
    digest=$(jq -r '.digest' <<<"$row")
    log "delete package version $pkg@$digest (id $vid)"
    if ! gh api -X DELETE "$PKG_BASE/packages/container/$pkg/versions/$vid" >/dev/null; then
      echo "[cleanup] ERROR: failed to delete package version $vid" >&2
      ERRORS=$((ERRORS + 1))
    fi
  done < <(jq -c '.delete.package_versions[]?' "$PLAN_FILE")

  while IFS= read -r cid; do
    [ -n "$cid" ] || continue
    log "delete actions cache $cid"
    if ! gh api -X DELETE "repos/$REPO/actions/caches/$cid" >/dev/null; then
      echo "[cleanup] ERROR: failed to delete cache $cid" >&2
      ERRORS=$((ERRORS + 1))
    fi
  done < <(jq -r '.delete.caches[]?.id' "$PLAN_FILE")

  while IFS= read -r rid; do
    [ -n "$rid" ] || continue
    log "delete workflow run $rid"
    if ! gh api -X DELETE "repos/$REPO/actions/runs/$rid" >/dev/null; then
      echo "[cleanup] ERROR: failed to delete run $rid" >&2
      ERRORS=$((ERRORS + 1))
    fi
  done < <(jq -r '.delete.workflow_runs[]?.id' "$PLAN_FILE")

  [ "$ERRORS" -eq 0 ] || fail "$ERRORS deletion(s) failed — see log above"
  log "apply complete"
  exit 0
fi

# ── Plan ──────────────────────────────────────────────────────────────────────
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

# 1. Protected digests — every image digest referenced by a published release's
#    manifest.json asset. A manifest that cannot be fetched is recorded so the
#    apply phase can fail closed.
log "collecting protected digests from published release manifests"
PROTECTED_LINES="$TMP/protected.txt"; : > "$PROTECTED_LINES"
FAILED_LINES="$TMP/failed.txt";      : > "$FAILED_LINES"

# Operator-declared pins are protected in addition to release-manifest digests.
if [ -n "${EXTRA_PROTECTED//[[:space:],]/}" ]; then
  while IFS= read -r digest; do
    digest=$(printf '%s' "$digest" | tr -d '[:space:]')
    [ -n "$digest" ] || continue
    [[ "$digest" =~ ^sha256:[0-9a-f]{64}$ ]] \
      || fail "invalid EXTRA_PROTECTED digest '$digest' (expected sha256:<64 hex>)"
    echo "$digest" >> "$PROTECTED_LINES"
  done < <(printf '%s\n' "$EXTRA_PROTECTED" | tr ',' '\n')
fi

RELEASE_TAGS=$(gh api --paginate "repos/$REPO/releases?per_page=100" \
  --jq '.[] | select(.draft == false) | .tag_name' 2>/dev/null) \
  || fail "could not enumerate published releases — refusing to plan image cleanup"
release_idx=0
while IFS= read -r tag; do
  [ -n "$tag" ] || continue
  release_idx=$((release_idx + 1))
  release_dir="$TMP/rel-$release_idx"
  if gh release download "$tag" --repo "$REPO" --pattern "manifest.json" \
       --dir "$release_dir" --clobber >/dev/null 2>&1 \
     && [ -f "$release_dir/manifest.json" ] \
     && jq -e '.images | type == "object" and length > 0' "$release_dir/manifest.json" >/dev/null 2>&1; then
    jq -r '.images | to_entries[] | .value' "$release_dir/manifest.json" \
      | grep -oE 'sha256:[0-9a-f]{64}' >> "$PROTECTED_LINES" || true
  else
    echo "$tag" >> "$FAILED_LINES"
  fi
done <<< "$RELEASE_TAGS"
sort -u -o "$PROTECTED_LINES" "$PROTECTED_LINES"
PROTECTED_JSON=$(jq -R . "$PROTECTED_LINES" | jq -s 'map(select(length > 0))')
FAILED_JSON=$(jq -R . "$FAILED_LINES" | jq -s 'map(select(length > 0))')
PROTECTED_COUNT=$(jq 'length' <<<"$PROTECTED_JSON")
FAILED_COUNT=$(jq 'length' <<<"$FAILED_JSON")
log "protected digests: $PROTECTED_COUNT (releases missing manifests: $FAILED_COUNT)"

is_protected() {
  local digest="$1"
  grep -qxF "$digest" "$PROTECTED_LINES"
}

# 2. GHCR package versions
PKG_JSON="$TMP/pkg-candidates.json"; echo '[]' > "$PKG_JSON"
for pkg in $PACKAGES; do
  log "enumerating ghcr.io/$OWNER/$pkg versions"
  if ! versions_raw=$(gh api --paginate "$PKG_BASE/packages/container/$pkg/versions?per_page=100" 2>/dev/null); then
    fail "could not enumerate GHCR package versions for $pkg"
  fi
  versions=$(jq -s 'add // []' <<<"$versions_raw")
  count=$(jq 'length' <<<"$versions")
  log "  $count version(s)"

  # Untagged versions: delete candidates unless the digest is protected.
  while IFS= read -r row; do
    [ -n "$row" ] || continue
    digest=$(jq -r '.name' <<<"$row")
    vid=$(jq -r '.id' <<<"$row")
    if is_protected "$digest"; then
      log "  keep untagged $digest — referenced by a release manifest"
      continue
    fi
    jq -c --arg p "$pkg" --arg d "$digest" --argjson id "$vid" \
      '{package:$p, id:$id, digest:$d, tags:[], reason:"untagged"}' <<<"$row" >> "$TMP/pkg-candidates.list"
  done < <(jq -c '.[] | select((.metadata.container.tags // []) | length == 0)' <<<"$versions")

  # Tagged versions beyond retention (newest first by updated_at); protected
  # versions are always kept and do not consume a retention slot.
  rank=0
  while IFS= read -r row; do
    [ -n "$row" ] || continue
    digest=$(jq -r '.name' <<<"$row")
    vid=$(jq -r '.id' <<<"$row")
    tags=$(jq -c '.metadata.container.tags' <<<"$row")
    if is_protected "$digest"; then
      # Protected digests are kept on top of the retained head and do not
      # consume a retention slot — keeping more is always safer.
      log "  keep tagged $tags ($digest) — referenced by a release manifest"
      continue
    fi
    rank=$((rank + 1))
    if [ "$rank" -le "$RETENTION" ]; then
      continue
    fi
    jq -c --arg p "$pkg" --arg d "$digest" --argjson id "$vid" --argjson t "$tags" \
      --arg r "beyond-retention(rank $rank)" \
      '{package:$p, id:$id, digest:$d, tags:$t, reason:$r}' <<<"$row" >> "$TMP/pkg-candidates.list"
  done < <(jq -c '[.[] | select((.metadata.container.tags // []) | length > 0)] | sort_by(.updated_at) | reverse | .[]' <<<"$versions")
done
if [ -f "$TMP/pkg-candidates.list" ]; then
  jq -s '.' "$TMP/pkg-candidates.list" > "$PKG_JSON"
fi

# 3. Actions caches older than CACHE_MAX_AGE_DAYS
log "enumerating actions caches older than ${CACHE_MAX_AGE_DAYS}d"
CUTOFF=$(( $(date +%s) - CACHE_MAX_AGE_DAYS * 86400 ))
if ! cache_rows=$(gh api --paginate --jq '.actions_caches[] | @json' \
    "repos/$REPO/actions/caches?per_page=100" 2>/dev/null); then
  fail "could not enumerate GitHub Actions caches"
fi
CACHES_JSON=$(jq -s --argjson cutoff "$CUTOFF" \
  '[ .[] | fromjson | select((.last_accessed_at | fromdateiso8601) < $cutoff)
     | {id, key, ref, last_accessed_at} ]' <<<"$cache_rows")

# 4. Workflow runs — keep newest RUNS_RETENTION non-success runs per workflow,
#    never touch successful runs.
log "enumerating workflow runs (non-success retention: $RUNS_RETENTION per workflow)"
RUNS_LIST="$TMP/run-candidates.list"; : > "$RUNS_LIST"
WORKFLOW_ROWS=$(gh api "repos/$REPO/actions/workflows?per_page=100" \
  --jq '.workflows[] | select(.state == "active") | @json' 2>/dev/null) \
  || fail "could not enumerate active workflows"
while IFS= read -r wf; do
  [ -n "$wf" ] || continue
  wf=$(jq -r 'fromjson' <<<"$wf" | jq -c '.')   # @json payloads arrive as JSON strings
  wf_id=$(jq -r '.id' <<<"$wf")
  wf_name=$(jq -r '.name' <<<"$wf")
  wf_path=$(jq -r '.path // ""' <<<"$wf")
  case "$wf_name:$wf_path" in
    release:*|*:*/release.yml)
      log "  skip $wf_name — release runs carry release evidence"
      continue ;;
  esac
  if ! run_rows=$(gh api --paginate --jq '.workflow_runs[] | @json' \
      "repos/$REPO/actions/workflows/$wf_id/runs?per_page=100&status=completed" 2>/dev/null); then
    fail "could not enumerate runs for workflow $wf_name"
  fi
  runs=$(jq -s '[ .[] | fromjson ]' <<<"$run_rows")
  # newest non-success runs first, drop the retained head, plan the rest
  kept=0
  while IFS= read -r run; do
    [ -n "$run" ] || continue
    conclusion=$(jq -r '.conclusion // ""' <<<"$run")
    case " $NON_SUCCESS_CONCLUSIONS " in
      *" $conclusion "*) ;;
      *) continue ;;  # success/neutral/skipped runs are never deleted
    esac
    kept=$((kept + 1))
    [ "$kept" -le "$RUNS_RETENTION" ] && continue
    jq -c --arg wf "$wf_name" \
      '{workflow:$wf, id:.id, conclusion:.conclusion, created_at:.created_at, reason:"old-non-success"}' \
      <<<"$run" >> "$RUNS_LIST"
  done < <(jq -c 'sort_by(.created_at) | reverse | .[]' <<<"$runs")
done <<< "$WORKFLOW_ROWS"
RUNS_JSON=$(jq -s '.' "$RUNS_LIST")

# 5. Emit plan
PKG_COUNT=$(jq 'length' "$PKG_JSON")
CACHE_COUNT=$(jq 'length' <<<"$CACHES_JSON")
RUN_COUNT=$(jq 'length' <<<"$RUNS_JSON")

jq -n \
  --arg repo "$REPO" \
  --arg ts "$(date -u +%FT%TZ)" \
  --argjson retention "$RETENTION" \
  --argjson runsret "$RUNS_RETENTION" \
  --argjson protected "$PROTECTED_JSON" \
  --argjson failed "$FAILED_JSON" \
  --argjson pkgs "$(cat "$PKG_JSON")" \
  --argjson caches "$CACHES_JSON" \
  --argjson runs "$RUNS_JSON" \
  '{
     generated_at: $ts,
     repo: $repo,
     retention: { tagged_image_versions: $retention, non_success_runs: $runsret },
     protected_digests: $protected,
     protected_fetch_failed: $failed,
     delete: {
       package_versions: $pkgs,
       caches: $caches,
       workflow_runs: $runs
     }
   }' > "$OUT"

log "plan written to $OUT"
log "summary: $PKG_COUNT package version(s), $CACHE_COUNT cache(s), $RUN_COUNT workflow run(s) would be deleted"
log "protected: $PROTECTED_COUNT digest(s) referenced by published releases"
[ "$FAILED_COUNT" -eq 0 ] || log "WARNING: $FAILED_COUNT published release(s) had no fetchable manifest.json — apply will refuse"
