# Technical Architecture — ElanjaiBuildos

## Stack

| Layer | Choice |
|-------|--------|
| Frontend | React 19 + TypeScript 5.7 + Vite 7 · Tailwind 4 · Radix UI/shadcn · TanStack Query · Context |
| Backend | Spring Boot 4.x · Java 25 · Spring Web/Security/Validation · Spring Data JPA + Hibernate multi-tenancy · Spring Mail · bucket4j · OpenHTMLtoPDF · Razorpay Java SDK · Flyway |
| Database | PostgreSQL 16 (Docker) · schema-per-tenant `t_<slug>` · `ddl-auto=validate` |
| Runtime | Docker Compose: postgres + backend + frontend + mailpit + volumes |
| Env | dev only; secrets via env vars |

## Multi-Tenancy Mechanics
- `CurrentTenantIdentifierResolver` — resolves tenant from request context (JWT `tenant_id`, authoritative, cross-checked vs Host subdomain; `X-Tenant-ID`/`?tenant=` dev fallback)
- `MultiTenantConnectionProvider` — shared pool, `SET search_path TO t_<slug>, public` per connection checkout
- Public-realm requests (platform console, signup, webhooks) bypass tenant resolution
- Tenant context cleared after request (ThreadLocal lifecycle)

## Auth Model
- Stateless JWT; two realms: `platform` (public schema users) vs `tenant` (`tenant_id` + role claims)
- `/api/auth/**`, `/api/public/**` (signup, slug check, webhook) public; tenant APIs require tenant-scoped JWT; `/api/platform/**` requires platform JWT
- Host↔JWT tenant mismatch → 403 (BR-020)

## Version Upgrade Notes (D-056)
- Spring Boot 3.2.3 → 4.x: Spring Framework 7, Hibernate 7, Jakarta EE namespace already in use; verify jjwt/lombok/Razorpay SDK compatibility at implementation
- Java 17 → 25 (current LTS); Maven toolchain update

## Rate Limiting
bucket4j on `/api/public/signup`, `/api/auth/login`, `/api/webhooks/razorpay`, slug-availability endpoint.

## File Storage
`storage.root` volume path; keys `t_<slug>/<kind>/<uuid>`; `files` metadata table; upload limits enforced against `storage_gb` usage counter.

## Email
Spring Mail → SMTP host/port/creds via env; dev → Mailpit (1025/8025). Templates server-side (Thymeleaf or plain text builder).

## Observability
- `platform_audit_log` for platform/security events (D-040)
- Request logging with tenant context; schema-drift report on startup
- Health endpoints for compose checks

## CI/CD
None this session; trunk-based local git.
