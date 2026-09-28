# Requirement Context — ElanjaiBuildos (Multi-Tenant SaaS Conversion)
> Shared memory across all requirement phases. Maintained by the AI; updated after every phase.

**Status:** ✅ COMPLETE — pending final sign-off
**Current Phase:** Phase 11 (Final Output)
**Last Updated:** 2026-09-27
**Project/Brand:** ElanjaiBuildos

---

## Cumulative Metrics

| Metric | Count |
|--------|-------|
| Total Phases Completed | 12 / 12 (00–11) |
| Total Iterations | 9 |
| Total Questions Asked | 48 (all answered) |
| Total Decisions Logged | 63 (D-001..D-063) |
| Total Business Rules | 30 (BR-001..BR-030) |
| Total Features Identified | 35 (F-001..F-055) |
| MVP Features | 28 must + 7 should (all in scope this session, sliced S1→S3) |
| Total Entities | 36 (10 public + 26 tenant) |
| Total Screens | 37 (9 public + 8 platform + 20 tenant) |
| Total User Stories | 10 new-feature US (US-001..010) + existing PRD stories |
| Gaps Found | 14 |
| Gaps Resolved | 14 |

---

## Brand Context

### Brand Identity
- **Brand Name:** ElanjaiBuildos
- **Tagline / Slogan:** Construction management platform for residential builders
- **Brand Values:** Professional, comprehensive, accessible (role-specific views), Indian construction-industry focus (₹ notation, CREDAI market)

### Target Audience
- **Primary:** Small-to-medium construction builders in India (Excel/WhatsApp users today)
- **Secondary:** Site managers and staff of those builders; the builders' clients (property owners)
- **Geographic Focus:** India (Tamil Nadu first, per business plan)

### Market Positioning
- **Category:** Construction management SaaS (B2B)
- **Differentiators:** Affordable (₹1.5K–10K/mo vs $50–200 competitors), simple UX for small builders, full quotation→project→tracking lifecycle
- **Competitors:** Expensive/complex enterprise tools; Excel/WhatsApp status quo

### Brand Guidelines (if available)
- **Colors:** Construction red primary `oklch(0.577 0.245 27.325)`, cool gray background, emerald accent
- **Tone of Voice:** Professional, business-grade
- **Logo:** HardHat icon; company logo upload supported per tenant in agreements

---

## Raw Client Input
```
(paraphrased from session kickoff)
The current project is a single-tenant construction management application for
construction companies — from quotation generation to a simple application for
customers, supervisors (site managers), admins. We need to make it a
multi-tenant application. Deeply understand the current context, then gather new
requirements for multi-tenancy, technical stack, and anything else needed; then
proceed through the pipeline: requirements → design → development.

Supporting sources:
- PRD.md (existing feature spec)
- resources/saas-subscription-business-plan.md (SaaS model, pricing, architecture sketch)
- Existing codebase (React 19 + Vite frontend, Spring Boot 3.2.3 + MySQL backend, JWT)
```

---

## Phase Completion Status

| Phase | Name | Status | Iterations | Summary |
|-------|------|--------|------------|---------|
| 00 | Requirement Intake | ✅ Complete | 1 | Extraction from existing app + business plan; all 10 clarifiers resolved |
| 01 | Domain & Vision | ✅ Complete | 1 | Vision statement + objectives approved (D-024..D-027) |
| 02 | Stakeholders & Users | ✅ Complete | 1 | 6 roles incl. PLATFORM_SUPPORT; permission matrix approved (D-028..D-031) |
| 02b | Tenancy & SaaS Modeling | ✅ Complete | 1 | Onboarding flow, plan catalog, lifecycle, metering approved (D-032..D-035) |
| 03 | Functional Requirements | ✅ Complete | 1 | 35 features, 10 US, 9 workflows, 25 BRs (D-036..D-038) |
| 04 | Non-Functional Requirements | ✅ Complete | 1 | NFR matrix approved (D-039..D-042) |
| 05 | UI/UX Requirements | ✅ Complete | 1 | 37 screens, neutral SaaS theme, light-only (D-043..D-046) |
| 06 | Data Architecture | ✅ Complete | 1 | Public+tenant entity catalog, dual-track Flyway (D-047..D-050) |
| 07 | Integration & External Services | ✅ Complete | 1 | Razorpay one-time payments, SMTP, local volume, OpenHTMLtoPDF (D-051..D-054) |
| 08 | Technical Constraints | ✅ Complete | 1 | Boot 4.x/Java 25 upgrade, *.localhost, Mailpit (D-055..D-058) |
| 09 | Gap Analysis | ✅ Complete | 1 | 14 gaps found & resolved (D-059..D-063) |
| 10 | Prioritization & MVP | ✅ Complete | 1 | MoSCoW + S1→S3 build slices approved (D-064) |
| 11 | Final Document Generation | ✅ Complete | 1 | Full doc set generated; pending sign-off |

---

## App Concept

Convert ElanjaiBuildos from a single-tenant construction management app into a **multi-tenant SaaS**: builders self-register, get approved by the platform admin, subscribe to a plan via Razorpay, and operate their own isolated workspace (schema-per-tenant on PostgreSQL) at their own subdomain — while the platform owner manages tenants, plans, and billing from a super-admin console.

## Domain & Vision

**Vision:** FOR small-to-medium construction builders in India WHO manage quotations, projects, labor and client communication in Excel/WhatsApp, ElanjaiBuildos IS A multi-tenant construction management SaaS THAT gives each builder an isolated, branded workspace covering the quotation→project→payment lifecycle — UNLIKE enterprise tools or fragmented manual processes, it is affordable (₹1.5K–10K/mo), purpose-built for Indian residential builders, and ready in minutes.

**Success metrics:** 10 paying tenants by month 3–4, 80 by month 12; signup→first-quotation < 30 min; daily attendance < 2 min on mobile web; 100% tenant isolation; provisioning < 60s; trial→paid ≥ 30%; signup→approval < 24h ops goal.

## Scope Definition
### In Scope
- Multi-tenant conversion of the existing app (all current features become tenant-scoped)
- Tenant signup → approval → provisioning → subscription billing (Razorpay) → lifecycle
- Platform super-admin console
- Plan/feature gating + usage limits
- Tenant branding (logo, colors)
- PostgreSQL migration + schema-per-tenant + Flyway
- Local dev deployment via Docker Compose

### Out of Scope
- Cloud/production deployment (07-devops later)
- i18n / vernacular (English only)
- MySQL data migration (fresh start)
- Mobile app
- Custom domains (deferred — confirm in Phase 02b)

### Deferred
- Tamil/vernacular localization; custom domains (D-019); white-label email sender; auto-flagging in signup review (D-016)

## Phase 00 Resolution Notes
- Trial: no card upfront; payment at trial end (D-012)
- Lapse: 7-day grace → full block; data preserved (D-013)
- Limits: hard block + upgrade prompt (D-014); staff-only seat counting (D-015)
- Approval: manual review by super-admin (D-016)
- Offboarding: ZIP export (CSV+files); schema deleted after 30 days (D-017)
- Email: generic SMTP / Spring Mail (D-018)
- Subdomain: fixed at signup, reserved-slug list, no custom domains (D-019)
- Billing: monthly + yearly discounted (D-020); Razorpay test keys available (D-021)
- Design stage: full redesign of all screens (D-022)
- Plan catalog: business-plan pricing as-is (D-023)

## Stakeholders & User Roles
<!-- Phase 02 — draft list captured in Phase 00 -->
- Platform super-admin (Elanjai): approve tenants, manage plans/subscriptions, suspend/offboard
- Tenant Owner: full access within tenant
- Tenant Admin: operational administration within tenant
- Site Manager: daily site entries, labor attendance
- Tenant's Client: read-only project portal

## Functional Requirements

### Feature Inventory

**Module A — Tenancy & Onboarding (platform, NEW)**
| # | Feature | Source | Priority |
|---|---------|--------|----------|
| F-001 | Public tenant signup (company, owner, email, phone, password, slug, plan; GSTIN optional) | D-005/032 | 🔴 Must |
| F-002 | Slug validation, reserved blocklist, availability check | D-033 | 🔴 Must |
| F-003 | Signup approval queue (approve/reject with reason) | D-005/016 | 🔴 Must |
| F-004 | Tenant schema provisioning on approval (create `t_<slug>`, Flyway migrate, seed masters) | D-002 | 🔴 Must |
| F-005 | Welcome email + first-login setup wizard (company, logo, packages) | D-031 | 🔴 Must |
| F-006 | Tenant lifecycle engine (PENDING_APPROVAL→PROVISIONING→TRIAL→ACTIVE→GRACE→SUSPENDED→CANCELLED→OFFBOARDING→DELETED) | D-013/017 | 🔴 Must |

**Module B — Subscription & Billing (NEW)**
| # | Feature | Source | Priority |
|---|---------|--------|----------|
| F-010 | Plan catalog CRUD (platform admin) | D-023 | 🔴 Must |
| F-011 | Razorpay subscription checkout (monthly/yearly) | D-004/020 | 🔴 Must |
| F-012 | 14-day trial (starts on provisioning; end reminders D-3/D-1; no card upfront) | D-012 | 🔴 Must |
| F-013 | Razorpay webhook handler (payment captured/failed, subscription events; signature-verified, idempotent) | D-004 | 🔴 Must |
| F-014 | GST-compliant invoice generation (platform+tenant GSTIN, SAC/HSN, CGST/SGST/IGST, sequential INV numbering) | D-027 | 🔴 Must |
| F-015 | Plan change: upgrade immediate prorated, downgrade at renewal | D-034 | 🟡 Should |
| F-016 | Cancellation → offboarding → ZIP export (CSV+files) → schema delete after 30d | D-017 | 🔴 Must |
| F-017 | Dunning: payment fail/trial expiry → 7d grace → suspend; reactivation on payment | D-013 | 🔴 Must |

**Module C — Plan Gating & Usage (NEW)**
| # | Feature | Source | Priority |
|---|---------|--------|----------|
| F-020 | Feature flags per plan (client portal, labor, adv. reports, API/white-label) | D-023 | 🔴 Must |
| F-021 | Usage counters + hard block + upgrade prompt (PLAN_LIMIT error) | D-014 | 🔴 Must |
| F-022 | Usage metering to admin console (users, projects, quotations/mo, storage, API calls, MRR) | D-026 | 🔴 Must |

**Module D — Platform Admin Console (NEW)**
| # | Feature | Source | Priority |
|---|---------|--------|----------|
| F-030 | Platform login (separate realm, public schema users) | D-006 | 🔴 Must |
| F-031 | Tenant list/detail (status, plan, usage, dates) | D-006 | 🔴 Must |
| F-032 | Approvals UI (approve/reject + reason) | D-016 | 🔴 Must |
| F-033 | Plan management UI | D-023 | 🟡 Should |
| F-034 | Subscriptions/payments + MRR dashboard | D-026 | 🔴 Must |
| F-035 | Suspend / reactivate / offboard actions | D-013/017 | 🔴 Must |
| F-036 | Platform settings (platform GSTIN, reserved slugs, SMTP status) | D-027/033 | 🟡 Should |
| F-037 | PLATFORM_SUPPORT read-only views | D-028 | 🟡 Should |

**Module E — Tenant Application (EXISTING → tenant-scoped)**
| # | Feature | Source | Priority |
|---|---------|--------|----------|
| F-040 | Tenant auth: login on tenant subdomain, JWT carries tenant_id; invite acceptance; email unique per tenant | D-002/003/029 | 🔴 Must |
| F-041 | Role dashboards (Owner/Admin/SiteMgr/Client) | existing | 🔴 Must |
| F-042 | Quotation engine (packages, materials, electrical, extra works, PDF/print) | existing | 🔴 Must |
| F-043 | Construction agreement generation (A4, letterhead, payment schedule) | existing | 🔴 Must |
| F-044 | Project creation from signed quotation (blocks/units, stage %, dates) | existing | 🔴 Must |
| F-045 | Project/site tracking (15 stages, expenses, collections, budget alerts) | existing | 🔴 Must |
| F-046 | Labor attendance, wages, advances, payments | existing | 🔴 Must |
| F-047 | Material estimator + history | existing | 🔴 Must |
| F-048 | Material tracking/inventory | existing | 🔴 Must |
| F-049 | Reports & analytics + CSV export | existing | 🔴 Must |
| F-050 | Settings masters (company, packages, materials, brands, stages, extra works) | existing | 🔴 Must |
| F-051 | Client portal (progress, payments, photos, change requests) | existing | 🔴 Must |
| F-052 | Photo upload/gallery | existing | 🔴 Must |
| F-053 | In-app notifications (tenant lifecycle + tenant events) | D-025 | 🟡 Should |
| F-054 | Tenant branding (logo + primary color applied at runtime on subdomain) | Phase 02b | 🟡 Should |
| F-055 | Tenant billing page (Owner only): plan, usage, invoices, upgrade/cancel | D-004 | 🔴 Must |

### User Stories (new tenancy features; existing-feature stories preserved from PRD)

**US-001** (F-001): As a builder, I want to sign up my company with a chosen subdomain and plan, so that I can start using the platform.
- AC: Given valid fields, when submitted, signup is PENDING_APPROVAL and confirmation email is sent.
- AC: Given taken/reserved slug, when submitted, then error "subdomain not available".
- AC: Given invalid email/weak password (<8 chars), then field errors.
- Denial/Failure: rate-limited signup endpoint; no tenant schema created until approval.

**US-002** (F-003/F-004): As a platform admin, I want to approve a pending signup, so that the tenant workspace is provisioned.
- AC: Approve → status PROVISIONING → schema `t_<slug>` created via Flyway + master seed → TRIAL starts (14d) → approval email sent.
- AC: Reject with reason → REJECTED + email; no schema.
- AC: Provision failure → status PROVISION_FAILED, retry action, no half-state (schema create is transactional/idempotent).

**US-003** (F-012): As a tenant owner, I want a 14-day trial after approval, so that I can evaluate before paying.
- AC: TRIAL status → full plan features of chosen plan; in-app banner shows days left; D-3 and D-1 reminders (in-app+email).
- AC: Trial expiry without payment → GRACE (7d, read+write allowed? No — grace allows login but blocks new writes) → SUSPENDED (no login, data preserved).
- Denial: suspended tenant login → "subscription suspended" screen + pay-now link.

**US-004** (F-011/F-013): As a tenant owner, I want to subscribe via Razorpay (monthly/yearly), so my workspace stays active.
- AC: Checkout creates Razorpay subscription; webhook `subscription.activated` → ACTIVE + invoice issued.
- AC: Webhook signature verified; duplicate delivery idempotent; unknown event logged.
- AC: `payment.failed` → GRACE + notification; retry link in billing page.

**US-005** (F-014): As the platform, I want GST-compliant invoices per billing event, so tenants have tax documents.
- AC: Invoice has sequential INV-YYYY-NNNN, platform GSTIN, tenant GSTIN (if given), SAC/HSN, taxable value, CGST+SGST (same-state) or IGST (inter-state), total, Razorpay ref.
- AC: Invoice PDF downloadable from tenant billing page and admin console.

**US-006** (F-020/F-021): As the platform, I want plan limits enforced server-side, so tenants can't exceed entitlements.
- AC: Create 6th project on Starter (limit 5) → 403 PLAN_LIMIT + upgrade prompt; quota shown in billing page.
- AC: Feature-gated module (e.g., labor on Starter) → upsell screen, API returns 403 FEATURE_LOCKED.
- AC: Usage counters update atomically on create/delete.

**US-007** (F-030/F-031): As platform admin, I want a console listing tenants with status/plan/usage, so I can operate the platform.
- AC: Tenant list searchable by name/slug, filter by status/plan; detail shows users/projects/storage/API usage, subscription, invoices, actions (suspend/reactivate/offboard/approve).
- AC: PLATFORM_SUPPORT sees same views read-only; mutation endpoints reject SUPPORT role.

**US-008** (F-016): As a tenant owner, I want to cancel and export my data, so I retain my records.
- AC: Cancel → CANCELLED at period end → OFFBOARDING: ZIP (CSV per table + files) generated, download link emailed; schema dropped after 30d retention; log shows export id.

**US-009** (F-040): As a tenant user, I want to log in on my company subdomain, so my session is scoped to my tenant.
- AC: JWT contains tenant_id; request resolves schema from JWT (authoritative) with host cross-check; mismatch → 403.
- AC: Same email can exist in two tenants independently; login only on own subdomain.
- AC: Invite link (72h, single-use) → set password → staff user active in tenant.

**US-010** (F-055): As a tenant owner, I want a billing page showing plan, usage vs limits, invoices, and upgrade/cancel, so I can manage my subscription.
- AC: Usage bars (projects/staff/quotations/storage); upgrade opens Razorpay checkout prorated; downgrade scheduled at renewal; cancel with confirmation + export offer.

### Workflows

**WF-01 Signup→Active:** signup → PENDING_APPROVAL → admin approve → PROVISIONING (schema+seed) → TRIAL(14d) → pay → ACTIVE. Reject → REJECTED+email.
**WF-02 Trial→paid:** D-3/D-1 reminders → expiry → GRACE(7d) → SUSPENDED → pay → ACTIVE.
**WF-03 Payment failure:** payment.failed webhook → GRACE + notify → retry success → ACTIVE; fail → SUSPENDED; pay → ACTIVE.
**WF-04 Offboard:** cancel → CANCELLED (end of period) → OFFBOARDING (export ZIP + email) → DELETED (+30d; schema drop + record purge).
**WF-05 Plan change:** upgrade → Razorpay proration checkout → applied now; downgrade → scheduled, applied at next invoice.
**WF-06 (existing) Quotation→Project:** Draft→Finalized→Sent→Signed→Converted (project created; immutable backward).
**WF-07 Invite:** invite email (72h) → accept → password set → active staff user.
**WF-08 Client change request:** client submits → tenant owner/admin review → approve/reject/schedule → visible in portal.

### Business Rules Catalog
| ID | Rule | Type |
|----|------|------|
| BR-001 | Email unique per tenant schema (not global) | Validation |
| BR-002 | Slug: 3–30 lowercase alnum+hyphen; reserved blocklist; immutable | Validation |
| BR-003 | Login allowed only when tenant in TRIAL/ACTIVE/GRACE | Authorization |
| BR-004 | Trial = 14 days from provisioning | Temporal |
| BR-005 | Payment fail/expiry → GRACE 7d → SUSPENDED; cancel → end-of-period → OFFBOARDING → delete +30d | Workflow |
| BR-006 | Construction stage percentages total exactly 100 | Validation |
| BR-007 | Quotation status flow one-way Draft→Finalized→Sent→Signed→Converted | Workflow |
| BR-008 | Attendance cannot be marked for future dates | Validation |
| BR-009 | Upgrade prorated immediate; downgrade at renewal | Calculation/Workflow |
| BR-010 | Hard block at limits: 403 PLAN_LIMIT + upgrade CTA | Authorization |
| BR-011 | Razorpay webhooks: signature verify + idempotency by event id | Security |
| BR-012 | GST: CGST+SGST intra-state, IGST inter-state (platform state vs tenant state) | Calculation |
| BR-013 | Invoice numbering INV-YYYY-NNNN sequential per FY | Validation |
| BR-014 | Only staff roles count toward user limit; clients exempt | Calculation |
| BR-015 | Platform users in public schema; tenant users in t_<slug> | Authorization |
| BR-016 | No cross-tenant reads; schema resolved only from verified context (JWT/host) | Authorization |
| BR-017 | Client portal read-only + change-request submit | Authorization |
| BR-018 | Invite links: 72h expiry, single-use | Temporal |
| BR-019 | Password ≥ 8 chars | Validation |
| BR-020 | JWT scoped: token valid only against its tenant | Security |

### Error & Edge Cases (critical)
- Unknown subdomain → generic "workspace not found" page (no tenant enumeration).
- JWT tenant vs host mismatch → 403.
- Provisioning failure → PROVISION_FAILED + retry; never half-provisioned.
- Webhook replay/out-of-order → idempotent, ordering by event time.
- Limit hit on create → 403 PLAN_LIMIT with upgrade link.
- Concurrent slug signup → DB unique constraint → friendly error.
- Session during suspension → next request → paywall screen.
- Tenant deletion during active session → JWT revoked scope fails → logged out.

### CRUD / Search-Sort (summary)
Tenant list: search name/slug, filter status/plan, sort createdAt desc. Users: invite/deactivate, role change (Owner/Admin). Subscriptions/invoices: filter status/date. Quotations: search client/project, filter status. Projects: filter status. All lists paginated 25/page.

## Non-Functional Requirements

| ID | Category | Requirement | Target |
|----|----------|-------------|--------|
| NFR-001 | capacity | Concurrent users | 50–500 |
| NFR-002 | latency | Page load | <1.5s |
| NFR-003 | latency | API p95: reads <500ms, writes <1s | 500ms/1s |
| NFR-004 | capacity | Data volume per tenant | 10K–1M rows; indexed FKs |
| NFR-005 | security | Auth: BCrypt, ≥8-char password, lockout after 5 fails, JWT 24h | — |
| NFR-006 | security | Schema-level tenant isolation; zero cross-tenant reads (BR-016), proven by isolation tests | — |
| NFR-007 | security | HTTPS, parameterized JPA, secrets via env vars, Razorpay holds card data | — |
| NFR-008 | availability | 99% target; daily pg_dump all schemas; RPO 24h; 30d backup retention | 0.99 |
| NFR-009 | accessibility | Best-effort: semantic HTML, keyboard nav | — |
| NFR-010 | usability | Fully responsive; mobile-first site-manager views; English/INR/IST | — |
| NFR-011 | other | Tenant provisioning <60s; signup→approval <24h ops | 60s |
| NFR-012 | compliance | DPDP (client PII minimization), GST invoicing, PCI via Razorpay | — |
| NFR-013 | other | Retention: tenant data until offboard+30d; platform/audit logs 1yr | — |
| NFR-014 | scalability | Vertical first; stateless backend = horizontal-ready | — |

## UI/UX Requirements

**Screens (37):** Public — S-001 landing, S-002 signup (slug+plan picker), S-003 pending-approval, S-004 tenant login, S-005 admin login, S-006 forgot/reset, S-007 workspace-not-found, S-008 invite acceptance, S-009 paywall/suspended. Platform — S-010 dashboard (MRR/status/approvals/trials), S-011 tenant list, S-012 tenant detail, S-013 approvals queue, S-014 plans, S-015 subscriptions/invoices, S-016 settings, S-017 audit log. Tenant — S-020 dashboard, S-021 site-mgr daily entry, S-022 client portal, S-023 site detail, S-024 quotation builder, S-025 agreement, S-026 project wizard, S-027 stages, S-028 labor, S-029 estimator, S-030 material tracking, S-031 reports, S-032 settings masters, S-033 users/invites, S-034 billing, S-035 branding, S-036 setup wizard, S-037 notifications.

**Design:** new neutral SaaS theme (slate/indigo, Stripe/Linear-style), light mode only, tenant accent-color override at runtime; admin console left sidebar; tenant app top navbar + tabs; fully responsive, mobile-first for site-manager flows.

## Data Architecture

**Isolation:** schema-per-tenant on PostgreSQL (D-002). `public` schema = platform data; `t_<slug>` = tenant workspace. Naming: `t_` prefix, ≤32 chars (pipeline convention). Hibernate `MultiTenantConnectionProvider` switches `search_path` per request; tenant resolved from JWT `tenant_id` (authoritative) cross-checked against Host subdomain (BR-016).

**Migration strategy:** Flyway dual-track — `db/migration` applies once to `public`; `db/migration-tenant` applied per-tenant-schema on provisioning + startup catch-up for existing tenants (version tracking per schema via `flyway_schema_history` inside each `t_*` schema). `ddl-auto=validate` replaces `update`.

### Entity Catalog — `public` schema (platform)

| ENT | Table | Key fields |
|-----|-------|-----------|
| ENT-P01 | `tenants` | id UUID pk, company_name, slug UNIQUE (3-30 `[a-z0-9-]`), schema_name UNIQUE, owner_name, owner_email, phone, gstin NULL, state, status ENUM, plan_id FK→plans, trial_ends_at, current_period_end, approved_by/at, reject_reason, suspended_at, cancelled_at, offboarded_at, deleted_at, created/updated_at |
| ENT-P02 | `platform_users` | id, email UNIQUE, password BCrypt, name, role ENUM(PLATFORM_ADMIN, PLATFORM_SUPPORT), active |
| ENT-P03 | `plans` | id, code UNIQUE (starter/professional/business/enterprise), name, price_monthly_inr, price_yearly_inr, max_projects, max_staff_users, max_quotations_per_month, storage_gb, feature_flags JSONB, is_active, sort_order |
| ENT-P04 | `subscriptions` | id, tenant_id FK, plan_id FK, razorpay_subscription_id, razorpay_customer_id, status ENUM, billing_cycle ENUM(monthly/yearly), current_period_start/end, cancel_at_period_end, scheduled_plan_id NULL, created/updated_at |
| ENT-P05 | `invoices` | id, invoice_number UNIQUE (INV-YYYY-NNNNN), tenant_id FK, subscription_id FK, razorpay_payment_id, period_start/end, taxable_amount, cgst, sgst, igst, total_inr, status ENUM(draft/paid/void/refunded), pdf_path, issued_at |
| ENT-P06 | `signup_requests` | id, company_name, owner_name, email, phone, password_hash, slug, gstin NULL, state, plan_id FK, status ENUM(pending/approved/rejected/provisioned/provision_failed), reviewed_by, reviewed_at, reject_reason, created_at |
| ENT-P07 | `usage_counters` | tenant_id FK, metric ENUM(staff_users/projects/quotations_month/storage_mb/api_calls_day), period_key (YYYY-MM for monthly metrics), value BIGINT, UNIQUE(tenant_id, metric, period_key) |
| ENT-P08 | `platform_audit_log` | id, actor_id, actor_role, action, entity_type, entity_id, details JSONB, ip, created_at |
| ENT-P09 | `platform_settings` | key pk, value, updated_at — platform GSTIN, address, state, SMTP host masked, reserved-slug list, invoice numbering seed |
| ENT-P10 | `tenant_notifications` (outbound queue) | id, tenant_id FK, channel ENUM(email/inapp), type ENUM(approved/rejected/trial_ending/payment_failed/suspended/cancelled/export_ready), payload JSONB, sent_at, status |

### Entity Catalog — `t_<slug>` schema (per tenant)

| ENT | Table | Key fields |
|-----|-------|-----------|
| ENT-T01 | `users` | id, email UNIQUE(per schema), password, full_name, phone, role ENUM(OWNER/ADMIN/SITE_MANAGER/CLIENT), status, created_by |
| ENT-T02 | `invites` | id, email, role, token UNIQUE, expires_at (72h), accepted_at, invited_by FK |
| ENT-T03 | `sites` | id, site_name, client_name, client_phone/email, client_user_id FK→users NULL, location, builtup_area, rate_per_sqft, package_name ENUM, total_value, current_stage ENUM, status ENUM, start/expected_end dates, blocks JSONB (apartment config), created_by, created_at |
| ENT-T04 | `site_stages` | id, site_id FK, name, percentage, budget_amount, actual_spent, status ENUM, planned/actual dates, order_index, notes, photos JSONB |
| ENT-T05 | `quotations` | id, quotation_number UNIQUE, client_name/phone/email, location, builtup_area, rate_per_sqft, package_name, total_value, status ENUM(draft/finalized/sent/signed/converted/cancelled), converted_site_id FK, created_by, timestamps + cancel fields |
| ENT-T05a | `quotation_stage_lines` | id, quotation_id FK, stage_name, percentage, amount, order_index — normalized stage/payment breakdown |
| ENT-T05b | `quotation_floor_materials` | id, quotation_id FK, floor_label, material_id FK, brand_id FK NULL, category, quantity, rate, notes — per-floor material selections |
| ENT-T05c | `quotation_electrical_rooms` | id, quotation_id FK, room_key, name, lights, fans, socket_5a, socket_15a, ac_provision, tv_point, other, switches_brand, wires_brand — normalized electrical provisions |
| ENT-T05d | `quotation_extra_works` | id, quotation_id FK, extra_work_id FK NULL, name, quantity, rate, amount — chosen extras |
| ENT-T06 | `collections` | id, site_id FK, stage_id FK NULL, amount, payment_mode ENUM, date, notes, recorded_by |
| ENT-T07 | `expenses` | id, site_id FK, stage_id FK, category ENUM(labor/material/equipment/transport/other), description, amount, date, approval_status ENUM(pending/approved/rejected), approved_by/at, rejection_reason, recorded_by |
| ENT-T08 | `material_spent` | id, site_id FK, material_type, quantity, unit, updated_by/at |
| ENT-T09 | `workers` | id, name, phone, type ENUM(8 types), daily_wage, project_id FK→sites, status(active/inactive), advance_balance, photo_url NULL |
| ENT-T10 | `daily_attendance` | id, date, project_id FK, marked_by, marked_at, notes + `attendance_records` (attendance_id FK, worker_id FK, status ENUM(present/half-day/absent/leave), wage_earned, overtime_hours/pay) UNIQUE(date, worker_id) |
| ENT-T11 | `worker_advances` | id, worker_id FK, amount, date, reason, recorded_by, status ENUM(pending-recovery/recovered/waived), recovered_amount/at |
| ENT-T12 | `payment_summaries` | id, project_id FK, week_start/end, items JSONB (worker payouts), total_gross/advances/net, status ENUM(pending-approval/approved/paid), approved_by/at, paid_at |
| ENT-T13 | `materials` | id, name, category ENUM(11), unit, rate_basic/standard/premium, is_active |
| ENT-T14 | `brands` | id, name, category, is_active |
| ENT-T15 | `packages` | id, code(basic/standard/premium/custom), name, rate_per_sqft, highlights JSONB, is_default |
| ENT-T16 | `stage_templates` | id, name, percentage, estimated_days, order_index |
| ENT-T17 | `extra_works` | id, name, description, rate, unit, default_enabled |
| ENT-T18 | `material_calculations` | id, project_id FK NULL, task_type ENUM(8), dimensions JSONB, results JSONB, calculated_by/at |
| ENT-T19 | `project_materials` | id, project_id FK, category, material_name, specified_brand, actual_brand_id FK NULL, est/actual qty, unit, status ENUM(pending/ordered/delivered/installed), status_history JSONB, notes |
| ENT-T20 | `site_photos` | id, site_id FK, stage_id FK NULL, file_id FK→files, caption, uploaded_by/at |
| ENT-T21 | `change_requests` | id, cr_number UNIQUE, project_id FK, description, type ENUM, category ENUM, cost_impact, timeline_impact, status ENUM(pending/approved/rejected/in-progress/completed), reference_image_id FK NULL, approver_notes, requested_by ENUM(client/builder), timestamps |
| ENT-T22 | `notifications` | id, user_id FK NULL(role-targeted NULL), type ENUM, title, message, link, read_by JSONB, created_at |
| ENT-T23 | `activity_logs` | id, site_id FK, type ENUM, title, description, user_id, metadata JSONB, created_at |
| ENT-T24 | `budget_alerts` | id, site_id FK, stage_id FK, type(warning/critical), threshold, current_spend, budget, message, acknowledged |
| ENT-T25 | `files` | id, path, content_type, size_bytes, kind ENUM(photo/logo/invoice/export/reference), uploaded_by, created_at — storage on local volume (dev), object storage later |
| ENT-T26 | `tenant_settings` | key pk, value JSONB — company profile, branding (accent color), agreement letterhead prefs |

### Relationships (tenant schema)
site 1—N stages/expenses/collections/material_spent/project_materials/site_photos/change_requests/activity_logs/budget_alerts · quotation 1—1 site (converted) · worker 1—N attendance_records/advances · payment_summary 1—N items (JSON) · client user N—M via `sites.client_user_id` (one client per site; multiple sites → repeat link) · files referenced by photos/logo.

### Enums
TenantStatus(pending_approval/provisioning/trial/active/grace/suspended/cancelled/offboarding/deleted/provision_failed/rejected) · SubscriptionStatus(created/authenticated/active/halt_requested/paused/cancelled/expired/completed — Razorpay-aligned) · BillingCycle · InvoiceStatus · PlatformRole · UserRole(4) · QuotationStatus · ProjectStatus(8) · StageStatus · ExpenseCategory(5) · ExpenseApprovalStatus · PaymentMode · MaterialCategory(11)/Status(4) · WorkerType(8) · AttendanceStatus(4) · PaymentStatus(3) · AdvanceStatus(3) · ChangeRequestStatus(5)/Type(3)/Category(7) · PackageType(4) · BuildingType(5) · TaskType(8) · MetricKey(5)

### Data Lifecycle
- Tenant DELETE: schema dropped at cancelled+30d (D-017); export ZIP generated on request during OFFBOARDING.
- Audit/platform rows: retained 12 months. Backups: daily all-schema dump, 30d retention (D-041).
- Seed per tenant on provision: default stage template (12 stages), default packages (3), starter material/brand masters, no demo transactional data (D-031 wizard + masters only).

### ADR (proposed)
- ADR-001: schema-per-tenant over row-level — isolation guarantee, per-tenant backup/restore, pipeline constraint (postgres). Trade-off: N×Flyway migrations, pool-per-schema avoided via shared pool + SET search_path.

## Integration & External Services

| Service | Purpose | Details |
|---|---|---|
| Razorpay (Orders/Payment Links + Webhooks) | Per-cycle billing | One-time payment per billing cycle (no mandates, D-051); invoice → Razorpay order/link → tenant pays → webhook marks paid → next period opens. Renewal reminders emailed D-7/D-3/D-1 before period end + at expiry. Test keys available (D-021). |
| SMTP via Spring Mail | Transactional email | welcome, approve/reject, trial D-3/D-1, payment failed, invoice issued, export ready, staff/client invites, renewal reminders |
| Local volume storage | Files | photos/logos/invoice PDFs/export ZIPs keyed by tenant slug; S3 adapter seam (D-048) |
| OpenHTMLtoPDF | GST invoice PDF | server-side PDF per invoice (D-053); quotation/agreement remain browser-print |
| Wildcard DNS | Tenant routing | `*.domain` prod; `*.localhost`/lvh.me + X-Tenant header dev |

Deferred: WhatsApp (D-052), Tally, SMS OTP, maps (D-054).

## Technical Stack & Infrastructure
<!-- Phase 08 — locked from intake -->
- Frontend: React 19 + Vite + Tailwind 4 + Radix UI, react-query, context
- Backend: Spring Boot 3.2.3, Java 17, JPA/Hibernate, JWT (+ tenant claim), bucket4j rate limit
- Database: PostgreSQL, schema-per-tenant, Flyway migrations
- Deploy: Docker Compose (dev/local only)

## Gap Analysis Results

14 gaps found, all resolved. Notable: C-01 grace semantics clarified (grace=read-only login; suspended=no login); Mobile App + API Access dropped from plan matrix (D-059); white-label = branding only (D-060); email verification at signup (D-061); downgrade-over-quota policy (D-062); 5 auto-resolved minor rules BR-021..025 (D-063). No unresolved contradictions; tenancy checks pass (Phase 02b present; schema-per-tenant on Postgres).

## Prioritization

MoSCoW approved (D-064): Must = F-001..006, F-010..014, F-016..017, F-020..022, F-030..032, F-034..035, F-040..046, F-049..052, F-055, landing/pricing. Should = F-015, F-033, F-036, F-037, F-053, F-054. Won't = custom domains, WhatsApp, mobile app, public API, Tally, MFA, i18n, dark mode, multi-region.
**Build slices:** S1 platform foundation (Postgres/Flyway, tenant resolver, JWT realms, signup→approval→provisioning, lifecycle, usage+gating, admin console, billing+webhooks, landing/signup/login) → S2 tenant core (auth+invites, dashboards, quotations+agreement, projects+stages, expenses+collections, settings, materials, billing page) → S3 extended (labor, estimator, tracking, reports, client portal, photos, change requests, notifications, branding).

---

## Decisions Log

| # | Decision | Rationale | Phase | Date |
|---|----------|-----------|-------|------|
| D-001 | Stages = requirement, design, development (no estimation/proposal) | Internal product conversion | intake | 2026-09-27 |
| D-002 | PostgreSQL + schema-per-tenant (migrate off MySQL) | Strong isolation; pipeline constraint | intake | 2026-09-27 |
| D-003 | Subdomain tenant identification; X-Tenant fallback for dev | SaaS-standard URLs | intake | 2026-09-27 |
| D-004 | Full Razorpay billing + 14-day trial on paid plans | Monetization day one | intake | 2026-09-27 |
| D-005 | Hybrid onboarding: signup → approval queue → provisioning | Tenant quality control | intake | 2026-09-27 |
| D-006 | Full super-admin console | Manage tenants/plans/billing | intake | 2026-09-27 |
| D-007 | Fresh start — no MySQL data migration | Existing data is demo/test | intake | 2026-09-27 |
| D-008 | Port full App.tsx feature set to backend, tenant-scoped | Feature parity with Spark version | intake | 2026-09-27 |
| D-009 | Local/dev deploy only (Docker Compose) | Cloud later via 07-devops | intake | 2026-09-27 |
| D-010 | English only (i18n deferred) | Scope control | intake | 2026-09-27 |
| D-011 | Rate limiting enabled (bucket4j) | Abuse protection on public signup | intake | 2026-09-27 |
| D-012..D-063 | See `_ledger/decisions.log` (append-only source of truth): trial/billing/lifecycle (D-012..023), metering+GST (D-024..027), roles/invites (D-028..031), signup fields+slug (D-032..033), plan-change+region (D-034..035), expense approval+grace semantics (D-036..038), NFR/audit/backup/a11y (D-039..042), theme/nav/landing (D-043..046), data model+files+stages (D-047..050), Razorpay one-time+PDF (D-051..053), scope cuts (D-054), Boot4/Java25/Mailpit/localhost/App.tsx removal (D-055..058), gap resolutions (D-059..063) | — | all | 2026-09-27 |
| D-064 | MoSCoW + S1→S3 build-slice order approved | Build foundation first, tenant features follow | phase-10 | 2026-09-27 |

## Assumptions Log

| # | Assumption | Status | Phase | Resolution |
|---|-----------|--------|-------|------------|
| A-001 | Existing roles (Owner/Admin/SiteManager/Client) carry over as *tenant* roles; new PLATFORM_ADMIN role is separate | ✅ Confirmed | 00 | D-028..030 |
| A-002 | Current `users.email` global uniqueness becomes unique-per-tenant | ✅ Confirmed | 00 | BR-001/BR-015 |
| A-003 | Pricing catalog from business plan is the starting point for plans | ✅ Confirmed | 00 | D-023 plan catalog |
| A-004 | Email delivery via SMTP-compatible provider | ✅ Confirmed | 00 | D-018 SMTP + Mailpit dev (D-057) |
| A-005 | Photos/logos on local filesystem/volume in dev; object storage later | ✅ Confirmed | 00 | D-048 local volume + S3 seam |

## Open Questions

| # | Question | Assigned To | Phase | Status | Resolution |
|---|----------|------------|-------|--------|------------|
| Q-001 | Trial payment capture: card/UPI mandate at signup vs trial without payment? | User | 00 | ✅ Resolved | No card upfront — pay at trial end (D-012) |
| Q-002 | Failed payment / lapse: grace period length + read-only vs full block? | User | 00 | ✅ Resolved | 7-day grace → full block (D-013) |
| Q-003 | Custom domain support for Enterprise tier, or subdomains only? | User | 00 | ✅ Resolved | Subdomains only; no custom domains (D-019) |
| Q-004 | Limit enforcement: hard block vs grace+warning? | User | 00 | ✅ Resolved | Hard block + upgrade prompt (D-014) |
| Q-005 | Do tenant *client* accounts count toward plan user limits? | User | 00 | ✅ Resolved | Staff only; clients free (D-015) |
| Q-006 | Approval criteria for super-admin? | User | 00 | ✅ Resolved | Pure manual review (D-016) |
| Q-007 | Offboarding export format + retention? | User | 00 | ✅ Resolved | ZIP (CSV+files), 30-day retention (D-017) |
| Q-008 | Transactional email provider? | User | 00 | ✅ Resolved | Generic SMTP / Spring Mail (D-018) |
| Q-009 | Subdomain rules; change slug later? | User | 00 | ✅ Resolved | Fixed at signup + reserved list (D-019) |
| Q-010 | Design stage scope? | User | 00 | ✅ Resolved | Full redesign of all screens (D-022) |
| Q-011 | Billing cycles? | User | 00 | ✅ Resolved | Monthly + yearly discounted (D-020) |
| Q-012 | Razorpay keys? | User | 00 | ✅ Resolved | Test keys available (D-021) |
| Q-013 | Plan catalog source? | User | 00 | ✅ Resolved | Business-plan pricing as-is (D-023) |
