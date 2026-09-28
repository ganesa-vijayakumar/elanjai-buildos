# Application Requirements — ElanjaiBuildos Multi-Tenant SaaS
**Version:** 1.0
**Status:** 🟡 DRAFT — pending client sign-off
**Generated:** 2026-09-27
**Iterations:** 9 (across phases 00–11)

## App Name
ElanjaiBuildos

## Domain
Construction management SaaS for small-to-medium residential builders in India (B2B, multi-tenant).

## Vision Statement
FOR small-to-medium construction builders in India WHO manage quotations, projects, labor and client communication in Excel/WhatsApp, ElanjaiBuildos IS A multi-tenant construction management SaaS THAT gives each builder an isolated, branded workspace covering the quotation→project→payment lifecycle — UNLIKE enterprise tools or fragmented manual processes, it is affordable (₹1.5K–10K/mo), purpose-built for Indian residential builders, and ready in minutes.

## User Roles
- **PLATFORM_ADMIN**: platform operator (public schema). Approves/rejects signups, manages plans, subscriptions, suspend/reactivate/offboard, usage dashboards, platform settings (GSTIN, reserved slugs), audit log.
- **PLATFORM_SUPPORT**: read-only platform views — tenant health, usage, billing status. No mutations.
- **OWNER** (tenant): full tenant access incl. billing page, branding, user management, settings masters, subscription upgrade/cancel.
- **ADMIN** (tenant): operational control — projects, quotations, labor, materials, reports, user invites, settings. No billing management.
- **SITE_MANAGER** (tenant): daily site entries — attendance, materials, expenses, photos — on assigned sites only.
- **CLIENT** (tenant's customer): read-only project portal + change-request submit; invited per project; free (not seat-counted).

## Core Entities
**Public schema (platform):**
- `tenants`: id, company_name, slug, schema_name, owner_name, owner_email, phone, gstin, state, status, plan_id, trial_ends_at, current_period_end, approved/rejected/suspended/cancelled/offboarded/deleted timestamps
- `platform_users`: id, email, password, name, role (PLATFORM_ADMIN/PLATFORM_SUPPORT), active
- `plans`: code, name, price_monthly/yearly_inr, max_projects, max_staff_users, max_quotations_per_month, storage_gb, feature_flags
- `subscriptions`: tenant_id, plan_id, razorpay ids, status, billing_cycle, period_start/end, scheduled_plan_id
- `invoices`: invoice_number (INV-YYYY-NNNNN), tenant_id, razorpay_payment_id, period, taxable/cgst/sgst/igst/total, status, pdf_path
- `signup_requests`: company/owner/email/phone/slug/gstin/plan, status, reviewed_by/at, reject_reason, email_verified
- `usage_counters`: tenant_id, metric, period_key, value
- `platform_audit_log`: actor, action, entity, details, ip, timestamp
- `platform_settings`: key/value (platform GSTIN, state, reserved slugs, invoice seed)
- `tenant_notifications`: tenant_id, channel, type, payload, status

**Tenant schema `t_<slug>` (per tenant):**
- `users` (email unique per tenant), `invites` (72h single-use)
- `sites`, `site_stages`, `quotations` + `quotation_stage_lines`/`floor_materials`/`electrical_rooms`/`extra_works` (normalized)
- `collections`, `expenses` (approval workflow), `material_spent`
- `workers`, `daily_attendance` + `attendance_records`, `worker_advances`, `payment_summaries`
- `materials`, `brands`, `packages`, `stage_templates`, `extra_works` (seeded masters)
- `material_calculations`, `project_materials`, `site_photos`, `change_requests`
- `notifications`, `activity_logs`, `budget_alerts`, `files`, `tenant_settings`

## Entity Relationships
- tenant → schema `t_<slug>` (1-1); subscription → invoices (1-n); plan → tenants/subscriptions (1-n)
- site 1—n stages/expenses/collections/material_spent/project_materials/photos/change_requests/activity_logs/budget_alerts
- quotation 1—1 site (converted); quotation 1—n normalized detail lines
- worker 1—n attendance_records/advances; client user n—m sites via sites.client_user_id (one client per site)

## Business Rules (BR-001..BR-025)
- Email unique per tenant schema; slug 3–30 lowercase alnum+hyphen, reserved blocklist, immutable
- Login only in TRIAL/ACTIVE/GRACE; trial = 14 days; grace = 7 days read-only; suspended = no login
- Upgrade immediate prorated; downgrade at renewal (over-quota tenants keep data, new creates blocked)
- Hard block at plan limits → 403 PLAN_LIMIT + upgrade CTA; staff-only seat counting
- Razorpay webhooks signature-verified + idempotent; GST: CGST+SGST intra-state / IGST inter-state; INV-YYYY-NNNNN numbering
- Stage percentages total 100; quotation flow Draft→Finalized→Sent→Signed→Converted (one-way)
- Attendance not for future dates; invite links 72h single-use; password ≥8; JWT tenant-scoped; client portal read-only
- Reset links 1h single-use; quotation numbers QTN-YYYY-NNNNN; UTC store/IST display; duplicate pending signup rejected; dev demo-tenant seed

## Pages / Screens Required (37)
Public: landing, pricing (in landing), signup, pending-approval, tenant login, admin login, forgot/reset, workspace-not-found, invite acceptance, paywall/suspended. Platform console: dashboard, tenant list/detail, approvals, plans, subscriptions/invoices, settings, audit. Tenant app: dashboard, site-mgr entry, client portal, site detail, quotation builder, agreement, project wizard, stages, labor, estimator, material tracking, reports, settings masters, users/invites, billing, branding, setup wizard, notifications.

## Advanced Features
- [x] Multi-tenant schema-per-tenant isolation (Must)
- [x] Signup → approval → provisioning → trial → billing lifecycle (Must)
- [x] Razorpay one-time billing + webhooks + GST invoice PDFs (Must)
- [x] Plan feature gating + usage metering + hard limits (Must)
- [x] Platform super-admin console + support role (Must/Should)
- [x] Full tenant app port: quotations, agreements, projects, stages, expenses, collections, labor, estimator, materials, reports, client portal, photos, change requests (Must)
- [x] Tenant billing page + branding + in-app notifications (Must/Should)
- [ ] Custom domains, WhatsApp, mobile app, public API, Tally, MFA, i18n, dark mode (Won't — this release)

## Tech Stack Preference
### Frontend
React 19 + TypeScript + Vite 7, Tailwind CSS 4, Radix UI/shadcn, TanStack Query, Context; neutral SaaS theme (light only), tenant accent override.
### Backend
Spring Boot 4.x, Java 25, Spring Data JPA/Hibernate (schema-per-tenant via `MultiTenantConnectionProvider` + `CurrentTenantIdentifierResolver`), Spring Security JWT (platform vs tenant realms), Spring Mail, bucket4j rate limiting, OpenHTMLtoPDF, Razorpay Java SDK.
### Database
PostgreSQL 16 (Docker), schema-per-tenant `t_<slug>`, Flyway dual-track migrations (`db/migration` public + `db/migration-tenant` per schema), `ddl-auto=validate`.

## Deployment Target
Local/dev only this session: Docker Compose = postgres + backend + frontend + mailpit + data volume. Wildcard `*.localhost` + `X-Tenant-ID`/`?tenant=` header fallback for dev tenant routing.

## Mobile App Needed
No — responsive web only (mobile-first site-manager views). Native app deferred.

## Environment Strategy
dev only. Secrets via env vars (Razorpay keys, SMTP, JWT secret, DB creds). Mailpit captures dev email.

## Additional Notes
- Fresh start: no MySQL data migration (D-007); legacy `App.tsx` + Spark/useKV removed after port (D-058)
- Compliance: DPDP (client PII), GST invoicing, PCI via Razorpay
- Audit: platform + security events logged 1yr (approvals, suspensions, plan changes, payments, logins, limit denials)
- Isolation is critical-security: cross-tenant isolation tests mandatory in dev pipeline
- Traceability: `_ledger/requirements.json`, `_ledger/traceability.csv`, `_ledger/decisions.log`, `_ledger/risks.md`
