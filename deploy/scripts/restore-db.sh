#!/usr/bin/env bash
# Restore helper — pairs with backup-db.sh (see Prody enhancements/02-tenancy/02
# and 03-deployment/02). Restores custom-format pg_dump files taken by
# backup-db.sh into the same schema names. Restoring loses post-backup writes —
# this is an operator action, never automated.
#
# Usage:
#   ./restore-db.sh backups/20260928T120000Z                 # every dump in the dir
#   ./restore-db.sh backups/20260928T120000Z t_acme          # specific schemas
#
# Env:
#   DATABASE_URL   (default postgresql://postgres:postgres@localhost:5433/elanjai)
set -euo pipefail

DIR="${1:?usage: restore-db.sh <backup-dir> [schema ...]}"
shift || true
DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5433/elanjai}"

if [ "$#" -gt 0 ]; then
    files=()
    for s in "$@"; do
        case "$s" in t_*|public) ;; *) s="t_$s" ;; esac
        f="$DIR/$s.dump"
        [ -f "$f" ] || { echo "Missing dump: $f" >&2; exit 1; }
        files+=("$f")
    done
else
    mapfile -t files < <(find "$DIR" -name '*.dump' | sort)
fi
[ "${#files[@]}" -gt 0 ] || { echo "No .dump files in $DIR" >&2; exit 1; }

for f in "${files[@]}"; do
    schema=$(basename "$f" .dump)
    echo "Restoring $schema from $f"
    pg_restore --dbname="$DATABASE_URL" --schema="$schema" \
        --clean --if-exists --no-owner --no-privileges "$f"
done

echo "Restore complete from $DIR — verify before resuming traffic."
