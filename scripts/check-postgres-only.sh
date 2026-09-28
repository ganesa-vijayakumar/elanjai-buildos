#!/usr/bin/env bash
set -euo pipefail

# scripts/check-postgres-only.sh
#
# PostgreSQL-only gate: fails when MySQL identifiers appear in the active
# runtime/build surface. The platform is schema-per-tenant PostgreSQL — a
# MySQL reference in shipped code or config is a defect.
#
#   Engine/driver : mysql, mysqld, jdbc:mysql, com.mysql, mysql-connector
#   Legacy config : MYSQL_*, TENANT_DB_*, per-database routing keys
#   Artifacts     : db/migration/mysql, testcontainers-mysql, flyway-mysql
#   Ports/mode    : 3306, H2 MODE=MySQL
#
# The scan is scoped to the active surface — application code, build config,
# deployment config, and CI/workflow files:
#
#   backend/src backend/pom.xml backend/Dockerfile apps packages deploy
#   scripts tests docker-compose.yml .env.example .github package.json
#   tsconfig.base.json eslint.config.js AGENTS.md README.md
#
# Historical planning docs (requirement*.md, output/, resources/, _ledger/,
# phase_context.md, Prody enhancements/) legitimately record the completed
# MySQL→PostgreSQL migration and are intentionally out of scope — a migration
# *record* is not a runtime dependency.
#
# git grep scans tracked files only, so .git, node_modules, target, dist,
# and other untracked build output are excluded by construction. Anything in
# scope that still matches must be listed, per exact path, in
# .github/postgres-only.allowlist with a written reason.

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ALLOWLIST=".github/postgres-only.allowlist"
PATTERN='mysql|mysqld|jdbc:mysql|com\.mysql|mysqlconnector|TENANT_DB_|MYSQL_|db/migration/mysql|MODE=MySQL|3306'

SCOPE=(
    backend/src
    backend/pom.xml
    backend/Dockerfile
    apps
    packages
    deploy
    scripts
    tests
    docker-compose.yml
    .env.example
    .github
    package.json
    tsconfig.base.json
    eslint.config.js
    AGENTS.md
    README.md
)

# Keep only paths that exist — a missing pathspec would fail the grep.
EXISTING=()
for p in "${SCOPE[@]}"; do
    [ -e "$p" ] && EXISTING+=("$p")
done

MATCHES="$(git grep -nIiE "$PATTERN" -- "${EXISTING[@]}" \
    ':(exclude)**/node_modules/**' || true)"

if [ -z "$MATCHES" ]; then
    echo "postgres-only: clean — no MySQL identifiers in the active surface"
    exit 0
fi

# Filter out allowlisted exact paths.
REMAINING=""
while IFS= read -r line; do
    [ -z "$line" ] && continue
    file="${line%%:*}"
    allowed=""
    if [ -f "$ALLOWLIST" ]; then
        while IFS= read -r entry; do
            case "$entry" in ''|\#*) continue ;; esac
            entry_path="${entry%%[[:space:]]*}"
            if [ "$file" = "$entry_path" ]; then
                allowed="$entry"
                break
            fi
        done < "$ALLOWLIST"
    fi
    if [ -z "$allowed" ]; then
        REMAINING="${REMAINING}${line}"$'\n'
    fi
done <<< "$MATCHES"

if [ -n "$REMAINING" ]; then
    echo "postgres-only: MySQL identifiers found in the active surface:"
    printf '%s' "$REMAINING"
    echo
    echo "Remove the MySQL reference, or record an exact-path allowlist entry with"
    echo "a reason in ${ALLOWLIST}."
    exit 1
fi

echo "postgres-only: clean — all residual hits are allowlisted"
