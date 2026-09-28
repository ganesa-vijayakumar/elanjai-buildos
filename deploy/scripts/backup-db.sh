#!/usr/bin/env bash
# Pre-destructive-change backup — required step before dropping a tenant schema
# or applying a contract migration (see Prody enhancements/02-tenancy/02 and
# 03-deployment/02). Writes one custom-format dump per schema to a timestamped
# directory.
#
# Usage:
#   ./backup-db.sh                 # public + every live tenant schema
#   ./backup-db.sh acme it-alpha   # public + the named tenant schemas
#
# Env:
#   DATABASE_URL   (default postgresql://postgres:postgres@localhost:5433/elanjai)
#   BACKUP_DIR     (default ./backups)
#   PGPASSWORD may be used instead of embedding credentials in DATABASE_URL.
set -euo pipefail

DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5433/elanjai}"
OUT="${BACKUP_DIR:-./backups}/$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$OUT"

echo "Backing up public schema -> $OUT/public.dump"
pg_dump "$DATABASE_URL" --schema=public --format=custom --file="$OUT/public.dump"

if [ "$#" -gt 0 ]; then
    schemas=("$@")
else
    mapfile -t schemas < <(psql "$DATABASE_URL" -tAc \
        "SELECT schema_name FROM tenants WHERE schema_name IS NOT NULL AND status <> 'OFFBOARDED'")
fi

for s in "${schemas[@]}"; do
    [ -z "$s" ] && continue
    case "$s" in t_*) schema="$s" ;; *) schema="t_$s" ;; esac
    case "$schema" in
        t_[a-z0-9-]*) ;;  # sanity — slug syntax already guards server side
        *) echo "Skipping unsafe schema name: $schema" >&2; continue ;;
    esac
    echo "Backing up $schema -> $OUT/$schema.dump"
    pg_dump "$DATABASE_URL" --schema="$schema" --format=custom --file="$OUT/$schema.dump"
done

echo "Backup complete: $OUT"
