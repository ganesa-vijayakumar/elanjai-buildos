# 01 — Independent Delivery: Per-App Images and Gateway Routing

[← Roadmap](../README.md) · Next: [02 — Rollout and Rollback](02-rollout-and-rollback.md)

## Purpose

Make each frontend independently buildable and deployable behind a host-based gateway,
so a landing-only change ships a new `buildos-landing` image while the tenant app,
admin app, and backend are untouched.

## Current state — observed

- `../../docker-compose.yml` has a **single** `frontend` service built from
  `../../Dockerfile.frontend` — whose build context is the **repo root** and runs
  `COPY . .`, so today's frontend image contains *all* sources; backend envs already
  define `TENANT_BASE_DOMAIN=localhost`, `TENANT_ADMIN_HOST=admin.localhost`,
  `TENANT_DEV_HEADER=true` (dev compose).
- `../../nginx.conf`: SPA fallback (`try_files … /index.html`) plus `location /api/`
  → `proxy_pass http://backend:8080` setting `Host`, `X-Forwarded-For`,
  `X-Forwarded-Host`.
- `../../requirement.md` Deployment Target: dev-only compose (postgres + backend +
  frontend + mailpit), wildcard `*.localhost` + `X-Tenant-ID`/`?tenant=` dev fallback.
- Reference cautionary tale ([01-architecture/01](../01-architecture/01-reference-gap-and-target.md)):
  `elanjai-office-pro`'s `docker/tenant-edge.Dockerfile` bundles landing at `/` and
  tenant SPA at `/app` into one image — the coupling we are removing.

## Target topology — recommended

```
                    ┌────────────────────────── gateway (nginx/edge) ──┐
                    │  host routing:                                    │
  buildos.example ──┤    apex/www      → landing:80                     │
  admin.<base>   ───┤    admin.<base>  → admin:80                       │
  <slug>.<base>  ───┤    *.<base>      → tenant:80                      │
                    └───────────────┬───────────────────────────────────┘
                                    │ each app nginx: SPA fallback +
                                    │   /api/ → backend:8080
                        ┌───────────┴───────────┐
                        │ backend :8080 (ONE)   │── postgres (public + t_<slug>)
                        └───────────────────────┘
```

Host contract:

| Host class | Example (placeholder) | Routes to | Notes |
|---|---|---|---|
| apex + www | `buildos.example`, `www.buildos.example` | `landing` | `/`, `/pricing`, `/signup`, `/verify-email`, `/pending`, `/login` (directory page) |
| admin | `admin.<base>` | `admin` | `/admin/login`, `/admin/*` |
| tenant wildcard | `<slug>.<base>` | `tenant` | everything else incl. `/login`, `/billing`, workspace routes; unknown slugs also land here — the **app** calls a public workspace-status lookup and renders `/workspace-not-found` (routing alone cannot decide) |

- No `/app` prefix for the tenant app — paths stay root-relative on the tenant host,
  so existing deep links keep working.
- The gateway routes **by `Host` only** and **preserves the canonical external
  `Host`** end-to-end (`proxy_set_header Host $host` at every hop). The backend's
  `TenantResolutionFilter` reads raw `Host` — **not** `X-Forwarded-Host` — so the
  normative model is *preserve Host + sanitize at the trust boundary*: the edge
  strips inbound `X-Forwarded-*` and tenant headers, and `?tenant=` is ignored
  server-side. (Adding trusted-forwarded-header resolution to the backend is a valid
  alternative, but only deliberately and with its own tests — this doc picks
  preserve-`Host`.)
- **Production backend must be reachable only through the trusted edge** (network
  policy / no direct published port). If arbitrary clients can hit the backend, they
  can spoof `Host` and jump tenants — the edge is the trust boundary.
- `/api/` is same-origin on every host class: each app's own nginx proxies
  `/api/` → `backend:8080` preserving `Host` (`../../nginx.conf` already does
  `proxy_set_header Host $host`). This keeps cookies/CORS simple and preserves tenant
  resolution. See the authoritative chain in
  [02-tenancy/01](../02-tenancy/01-identity-and-isolation.md).

## Per-app packaging — recommended

Each app directory owns its Dockerfile with **its own directory as build context**:

```dockerfile
# frontend-landing/Dockerfile (conceptual — same pattern for tenant/admin)
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund
COPY . .                                  # context is frontend-landing/ ONLY
ARG VITE_API_BASE_URL=/api
ARG VITE_BASE_DOMAIN=localhost
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

Rules:

1. **The landing image build must never `COPY` tenant or admin sources.** Scoped
   build contexts enforce this structurally; CI should also assert it (see
   [04-quality/02](../04-quality/02-verification-matrix.md)).
2. Image names: `buildos-landing`, `buildos-tenant`, `buildos-admin` — tagged with the
   git SHA, promoted by immutable digest (see [rollout doc](02-rollout-and-rollback.md)).
3. Per-app `nginx.conf` serves only that app's routes: SPA fallback for owned paths,
   a strict 404/redirect for anything else, and the `/api/` proxy block preserving
   `Host` (`proxy_set_header Host $host`) while not forwarding client-supplied
   `X-Forwarded-*`/tenant headers.

### Compose sketch — conceptual only (do not paste blindly; dev defaults must not ship)

```yaml
services:
  postgres:   # unchanged from ../../docker-compose.yml
  mailpit:    # unchanged
  backend:    # unchanged binary; add CORS allow-list envs for the 3 origins
  landing:
    build: { context: ./frontend-landing }
    image: buildos-landing:dev
  tenant:
    build: { context: ./frontend-tenant }
    image: buildos-tenant:dev
  admin:
    build: { context: ./frontend-admin }
    image: buildos-admin:dev
  gateway:
    image: nginx:alpine
    ports: ["80:80"]
    volumes: ["./deploy/gateway.conf:/etc/nginx/conf.d/default.conf:ro"]
    depends_on: [landing, tenant, admin]
```

`deploy/gateway.conf` (conceptual) maps `server_name buildos.example www.*` →
`proxy_pass http://landing`, `admin.*` → `http://admin`, `*.<base>` → `http://tenant`
— each with `proxy_set_header Host $host;` plus explicit drops for inbound
`X-Forwarded-*`/`X-Tenant-ID` headers at the edge.

### Dev routing

Two supported dev modes — pick one as primary and document in each app's README:

- **Wildcard hosts (prod-like):** `*.localhost` resolves locally in modern browsers.
  Gateway on `:80`; use `acme.localhost`, `admin.localhost`, `localhost` apex.
  Backend env already matches (`TENANT_BASE_DOMAIN=localhost`,
  `TENANT_ADMIN_HOST=admin.localhost`).
- **Distinct ports (fallback):** landing `:5173`, tenant `:5174`, admin `:5175` with
  `?tenant=<slug>` / `VITE_DEV_TENANT_PARAM` for tenant selection; useful where
  wildcard DNS isn't available.

## Legacy links and edge concerns

- **Preserve existing paths**: `/accept-invite?token=…`, `/reset-password?token=…`,
  `/verify-email?token=…`, `/billing`, `/pending` must resolve on the correct host
  class after split. Audit backend-generated links (`platform/service/PlatformMailService.java`,
  invite/reset flows) and parameterize by `TENANT_BASE_DOMAIN`/`TENANT_ADMIN_HOST` —
  emails should point at `<slug>.<base>` or `admin.<base>` as appropriate.
- **Uploads/files**: backend file URLs under `/api/...` are host-relative and work on
  any host class; confirm no absolute URLs are persisted (check
  `FileStorageService`).
- **Callbacks**: payment/webhook callbacks (Razorpay — `WebhookController`) target the
  backend directly or via a fixed API host; they must not depend on frontend hosts.
- **CSP**: per-app `Content-Security-Policy` in each nginx — `default-src 'self'`,
  connect-src limited to same-origin `/api`; no shared permissive policy.
- **Cache**: immutable `Cache-Control` for hashed assets; `index.html` no-cache on all
  three apps.
- **SEO/indexing basics (P0)**: landing serves `robots.txt` + correct meta/OG tags;
  tenant and admin serve `X-Robots-Tag: noindex` — workspace data must never index.
  `sitemap.xml` and prerender/SSR for landing are **P1-optional** and only if metrics
  justify — see [04-quality/01](../04-quality/01-reusable-enhancements.md).

## Environment variables — recommended

| Var | Apps | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | all | default `/api` (same-origin) |
| `VITE_BASE_DOMAIN` | landing, tenant | build `tenantUrl(slug)`; apex redirects |
| `VITE_ADMIN_HOST` | landing (link-outs), admin | admin console URL |
| `VITE_DEV_TENANT_PARAM` | tenant | enables `?tenant=` override — dev builds only |
| `TENANT_BASE_DOMAIN`, `TENANT_ADMIN_HOST` | backend env (already exist) | link generation + host validation |
| `TENANT_DEV_HEADER` | backend env | `true` only in dev compose; must default `false`/fail-closed in `application.properties` (P0 fix — it currently defaults `true`) |
| `CORS_ALLOWED_ORIGINS` (new) | backend env | exact list of frontend origins |

## Ownership

| Item | Owner |
|---|---|
| Per-app Dockerfile/nginx/package | frontend app owner |
| `deploy/gateway.conf` + gateway service | platform/devops |
| Backend CORS + link generation | backend |
| DNS/wildcard cert (when leaving dev) | platform/devops — out of this repo's dev scope but listed for completeness |

## Acceptance criteria

- [ ] `docker compose config` shows `landing`, `tenant`, `admin`, `gateway`, `backend`,
  `postgres`, `mailpit` — no combined `frontend` service after cutover.
- [ ] Landing-only change: `docker compose build landing && docker compose up -d
  landing` (conceptual — runbook detail in [rollout doc](02-rollout-and-rollback.md))
  produces a new landing container only; `docker ps` shows tenant/admin/backend
  containers with unchanged start times.
- [ ] Host routing verified: apex→landing, `admin.localhost`→admin,
  `<slug>.localhost`→tenant, unknown slug→tenant app → workspace-status lookup →
  `/workspace-not-found`.
- [ ] `/api/` reachable same-origin on all three host classes; backend resolves tenant
  from the preserved canonical `Host`; `X-Tenant-ID` ineffective with
  `TENANT_DEV_HEADER=false`; inbound `X-Forwarded-*`/`X-Tenant-ID` stripped at the edge.
- [ ] Path-scoped CI (P0): a `frontend-landing/**`-only change runs/builds only the
  landing pipeline; shared `packages/**` and gateway/deploy changes trigger their
  dependents — see [04-quality/02](../04-quality/02-verification-matrix.md).
- [ ] Every link in the route-ownership table
  ([01-architecture/02](../01-architecture/02-frontend-extraction.md)) returns the
  right app; legacy invite/reset links resolve.
- [ ] Image inspection proves landing image contains no tenant/admin source files.

## Risks & dependencies

| Risk | Mitigation |
|---|---|
| Gateway becomes SPOF/misroute risk | Tiny static config; smoke-test all three host classes on every gateway change; keep combined image deployable until R3 |
| `Host`-header spoofing | Backend reachable only via the trusted edge in prod (no direct published port); edge preserves canonical `Host` + strips client `X-Forwarded-*`/tenant headers; spoofed suffixes also fail the suffix-match rule ([02-tenancy/01](../02-tenancy/01-identity-and-isolation.md)) |
| Email links generated for old host scheme | Parameterize + audit before cutover; test-mail each flow via mailpit |
| Dev: `*.localhost` doesn't resolve on some environments | Ports fallback documented; `?tenant=` dev flag retained |
| Cache poisoning between apps via shared CDN/proxy later | Distinct hostnames isolate caches; per-app CSP |

## Dependencies

- Frontend apps must exist first: [01-architecture/02](../01-architecture/02-frontend-extraction.md)
  Phase A1–A4.
- Backend env additions (CORS list) — small backend change, same phase.
- Rollout order and rollback mechanics: [02-rollout-and-rollback](02-rollout-and-rollback.md).
