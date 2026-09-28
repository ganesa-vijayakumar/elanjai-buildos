# Project Overview — ElanjaiBuildos Multi-Tenant SaaS

## Vision
FOR small-to-medium construction builders in India WHO manage quotations, projects, labor and client communication in Excel/WhatsApp, ElanjaiBuildos IS A multi-tenant construction management SaaS THAT gives each builder an isolated, branded workspace covering the quotation→project→payment lifecycle — UNLIKE enterprise tools or fragmented manual processes, it is affordable (₹1.5K–10K/mo), purpose-built for Indian residential builders, and ready in minutes.

## Domain
Construction management SaaS (B2B, India). Residential builders run quotations, project stage tracking, labor/materials, expenses/collections, and a client portal inside an isolated tenant workspace. Elanjai operates the platform: signup approval, plans, Razorpay billing, tenant lifecycle.

## Problem Statement
The existing ElanjaiBuildos is single-tenant: every deployment serves one builder. To monetize as SaaS, each builder needs their own isolated workspace with subscription billing, plan gating, onboarding, and platform-level operations — while keeping the full construction feature set.

## Success Criteria
- 10 paying tenants by month 3–4; 80 by month 12 (per business plan)
- Builder signup → first quotation in < 30 min; site manager attendance in < 2 min on mobile web
- 100% tenant isolation (zero cross-tenant reads), proven by isolation tests
- Tenant provisioning < 60s; trial→paid ≥ 30%; signup→approval < 24h (ops)

## Scope
### In Scope
- Multi-tenant conversion: schema-per-tenant PostgreSQL, subdomain routing, JWT tenant scoping
- Signup → approval queue → schema provisioning → 14-day trial → Razorpay billing → lifecycle (grace/suspend/offboard)
- Plan catalog + feature gating + usage metering + hard limits
- Platform super-admin console (tenants, approvals, plans, subscriptions, settings, audit) + read-only support role
- Full port of existing app features (labor, estimator, agreements, stages, photos, change requests, client portal, reports)
- Tenant branding, in-app + email notifications, GST-compliant invoice PDFs
- Local dev deployment via Docker Compose (postgres, backend, frontend, mailpit)

### Out of Scope
- Cloud/production deployment; CI/CD; MySQL data migration (fresh start); i18n; native mobile; offline mode

### Deferred
- Custom domains, white-label email, auto-flagging in review, WhatsApp, Tally, SMS OTP, maps, MFA, dark mode, public API, multi-region, S3 storage (adapter seam only)

## Stakeholders
- Platform owner (Elanjai): revenue, platform health, tenant quality — PLATFORM_ADMIN
- Support staff: read-only visibility — PLATFORM_SUPPORT
- Tenant owners (builders): full workspace + billing — OWNER
- Tenant staff: admins and site managers — ADMIN / SITE_MANAGER
- Tenant clients (property owners): project portal — CLIENT

## Assumptions
- Roles carry over as tenant roles; PLATFORM_ADMIN/SUPPORT live in public schema (D-028..030)
- Email unique per tenant (BR-001); pricing from business plan (D-023)
- SMTP email (D-018) via Mailpit in dev (D-057); local volume file storage (D-048)
- Spring Boot 4.x + Java 25 upgrade accepted (D-056)

## Constraints
- PostgreSQL mandatory for schema-per-tenant (pipeline + D-002)
- Local-only deployment this session (D-009); secrets via env vars
- Tenant isolation is critical-security — isolation tests required
- Budget: right-sized infra; single-region India Postgres (D-035)
