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
#   PG_CONTAINER   set to a running postgres container name to run pg_dump/psql
#                  via docker exec (for dev machines without local pg clients);
#                  dumps stream over stdout so files land on the host.
#   PG_USER, PG_DB  credentials used with PG_CONTAINER (default postgres/elanjai)
#   PGPASSWORD may be used instead of embedding credentials in DATABASE_URL.
set -euo pipefail

DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5433/elanjai}"
OUT="${BACKUP_DIR:-./backups}/$(date -u +%Y%m%dT%H%M%SZ)"
PG_CONTAINER="${PG_CONTAINER:-}"
PG_USER="${PG_USER:-postgres}"
PG_DB="${PG_DB:-elanjai}"
mkdir -p "$OUT"

pg_query() { # single-column query -> stdout
    if [ -n "$PG_CONTAINER" ]; then
        docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" -tAc "$1"
    else
        psql "$DATABASE_URL" -tAc "$1"
    fi
}

dump_schema() { # $1 schema, $2 outfile
    if [ -n "$PG_CONTAINER" ]; then
        docker exec "$PG_CONTAINER" pg_dump -U "$PG_USER" -d "$PG_DB" \
            --schema="$1" --format=custom > "$2"
    else
        pg_dump "$DATABASE_URL" --schema="$1" --format=custom --file="$2"
    fi
}

echo "Backing up public schema -> $OUT/public.dump"
dump_schema public "$OUT/public.dump"

if [ "$#" -gt 0 ]; then
    schemas=("$@")
else
    mapfile -t schemas < <(pg_query \
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
    dump_schema "$schema" "$OUT/$schema.dump"
done

echo "Backup complete: $OUT"
