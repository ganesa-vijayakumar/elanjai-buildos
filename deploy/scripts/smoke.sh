#!/usr/bin/env bash
# Host-class smoke suite — run after any gateway/deploy change and at each
# rollout stage (Prody enhancements/03-deployment/02). Asserts that every host
# class reaches the right app and that the public API works through the edge.
#
# Usage:
#   ./deploy/scripts/smoke.sh                          # gateway on :80, tenant slug "demo"
#   ./deploy/scripts/smoke.sh http://localhost:8088    # R0 parallel deploy on alt port
#   ./deploy/scripts/smoke.sh http://localhost:80 demo
#
# Env overrides: APEX_HOST, WWW_HOST, ADMIN_HOST, BASE_DOMAIN.
set -u

BASE="${1:-http://localhost}"
SLUG="${2:-demo}"
APEX_HOST="${APEX_HOST:-localhost}"
WWW_HOST="${WWW_HOST:-www.localhost}"
ADMIN_HOST="${ADMIN_HOST:-admin.localhost}"
BASE_DOMAIN="${BASE_DOMAIN:-localhost}"

fail=0
check() { # <name> <host> <path> <expected-substring>
    local name="$1" host="$2" path="$3" expect="$4"
    local code body
    code=$(curl -s -o /tmp/buildos-smoke.$$ -w '%{http_code}' -H "Host: $host" "$BASE$path")
    body=$(head -c 8192 /tmp/buildos-smoke.$$)
    if printf '%s' "$body" | grep -qF "$expect"; then
        echo "PASS  $name  ($host$path -> $code)"
    else
        echo "FAIL  $name  ($host$path -> $code)"; fail=1
    fi
}
check_code() { # <name> <host> <path> <expected-http-code>
    local name="$1" host="$2" path="$3" expect="$4"
    local code
    code=$(curl -s -o /dev/null -w '%{http_code}' -H "Host: $host" "$BASE$path")
    if [ "$code" = "$expect" ]; then
        echo "PASS  $name  ($host$path -> $code)"
    else
        echo "FAIL  $name  ($host$path -> $code, expected $expect)"; fail=1
    fi
}

# --- host routing: right app per host class (asserting each app's <title>) ---
check "apex -> landing"     "$APEX_HOST"              "/"  "Construction Management for Builders"
check "www -> landing"      "$WWW_HOST"               "/"  "Construction Management for Builders"
check "admin -> console"    "$ADMIN_HOST"             "/"  "Platform Console"
check "slug -> tenant app"  "$SLUG.$BASE_DOMAIN"      "/"  "Workspace"
check "unknown slug -> app" "nope-xyz.$BASE_DOMAIN"   "/"  "Workspace"   # tenant app renders /workspace-not-found

# --- same-origin API on every host class ---
check "api via apex"      "$APEX_HOST"            "/api/public/tenants/$SLUG/status"  '"exists":'
check "api via admin"     "$ADMIN_HOST"           "/api/public/tenants/$SLUG/status"  '"exists":'
check "api via tenant"    "$SLUG.$BASE_DOMAIN"    "/api/public/tenants/$SLUG/status"  '"exists":true'
check "unknown workspace" "$APEX_HOST"            "/api/public/tenants/nope-xyz/status" '"exists":false'

# --- auth boundary: tenant login works, admin login lives only on admin host ---
check_code "tenant auth surface" "$SLUG.$BASE_DOMAIN" "/api/auth/me" "403"
check_code "admin auth surface"  "$ADMIN_HOST"        "/api/admin/dashboard" "403"

# --- uptime probe: backend health reachable through the edge on every host ---
check "backend health (apex)"   "$APEX_HOST"           "/api/actuator/health" '"status":"UP"'
check "backend health (tenant)" "$SLUG.$BASE_DOMAIN"   "/api/actuator/health" '"status":"UP"'

# --- landing seo + version surfaces ---
check "robots.txt"    "$APEX_HOST" "/robots.txt"  "User-agent"
check_code "version stamp" "$APEX_HOST" "/version.txt" "200"

rm -f /tmp/buildos-smoke.$$
if [ "$fail" -eq 0 ]; then echo "All smoke checks passed."; else echo "SMOKE FAILURES"; exit 1; fi
