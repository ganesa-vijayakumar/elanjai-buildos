# Build / test / run

## Layout
- `backend/` — Spring Boot 4 (Java 25), schema-per-tenant PostgreSQL.
- `apps/landing`, `apps/tenant`, `apps/admin` — independent Vite/React 19 SPAs.
- `packages/shared` — `@buildos/shared` (host helpers, api client, storage keys, cn).
- `deploy/gateway.conf` — nginx edge router (apex→landing, admin.*→admin, <slug>.*→tenant).
- `Prody enhancements/` — architecture/tenancy/deployment roadmap.

## Local dev
- `npm install` once at root (npm workspaces).
- `npm run dev:landing|dev:tenant|dev:admin` — vite on 5173/5174/5175, `/api` proxied to :8080.
- `npm run typecheck`, `npm run lint`, `npm run build[:landing|:tenant|:admin]`.
- Tenant dev override: `?tenant=<slug>` or localStorage `tenant_slug` (dev builds only).

## Backend
- Requires Java 25 — local JDK21 cannot compile; build/test in Docker:
  `docker run --rm --network elanjai-buildos_default -v <repo>/backend:/app -v maven-m2:/root/.m2 -w /app -e TEST_DB_URL=jdbc:postgresql://postgres:5432/elanjai_test maven:3.9-eclipse-temurin-25 mvn -B verify`
- Unit tests (surefire, `*Test`) + integration tests (failsafe, `*IT`) run under `mvn verify`.
- ITs need a sandbox DB `elanjai_test` on the compose postgres (never `elanjai`):
  `docker exec elanjai-postgres psql -U postgres -c "CREATE DATABASE elanjai_test"`

## Full stack
- `docker compose up -d --build` → gateway on :80; `http://localhost` landing,
  `http://admin.localhost` console, `http://<slug>.localhost` workspace.
- Per-app debug ports: landing :5173, admin :5174, tenant :5175 (→ :80 each).
- Dev compose enables `TENANT_DEV_HEADER`; production must leave it unset/false.
