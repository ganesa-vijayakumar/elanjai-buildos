# Functional Requirements — ElanjaiBuildos

35 features across 5 modules. Priorities: 🔴 Must / 🟠 Should / 🟡 Could. Build slices: S1 platform foundation → S2 tenant core → S3 extended.

## Module A — Tenancy & Onboarding (platform, NEW) — S1

### F-001 Public tenant signup 🔴
Fields: company, owner name, email, phone, password, subdomain slug, plan selection, GSTIN optional.
- US-001: As a builder, I want to sign up with a chosen subdomain and plan, so I can start using the platform.
  - AC: valid submit → PENDING_APPROVAL + confirmation email + verification link
  - AC: taken/reserved slug → "subdomain not available"; weak password/invalid email → field errors
  - AC: duplicate pending signup email → "signup already pending" (BR-024)
  - Denial: rate-limited; no schema created until approval

### F-002 Slug validation & reserved blocklist 🔴
3–30 chars, `[a-z0-9-]`, reserved list (admin/api/www/app/mail/support/…), uniqueness → DB constraint; immutable (BR-002).

### F-003 Approval queue 🔴
Admin reviews pending signups: approve → provisioning; reject + reason → REJECTED + email. Verified-email badge shown (BR-029).

### F-004 Schema provisioning 🔴
- US-002: approve → PROVISIONING → create `t_<slug>`, run tenant Flyway migrations, seed masters, set TRIAL (14d)
  - AC: failure → PROVISION_FAILED + retry; transactional/idempotent; never half-provisioned

### F-005 Welcome email + setup wizard 🔴
Approval → welcome email with login URL + credentials note; first login → setup wizard (company profile, logo, packages confirm) + seeded master data.

### F-006 Tenant lifecycle engine 🔴
`PENDING_APPROVAL → PROVISIONING → TRIAL(14d) → ACTIVE → GRACE(7d) → SUSPENDED → CANCELLED → OFFBOARDING → DELETED(+30d)`
- GRACE = read-only login, writes blocked (BR-026); client portal shows graceful message (BR-027); SUSPENDED = no login.

## Module B — Subscription & Billing (NEW) — S1

### F-010 Plan catalog 🔴
Plans table seeded from business plan; admin CRUD (🟠 UI). Fields: code, monthly/yearly INR, limits, feature_flags.

### F-011 Razorpay checkout 🔴
One-time payment per cycle via Razorpay order/payment link (D-051 — no mandates). Upgrade → prorated immediate; downgrade → scheduled at renewal (BR-009).
- US-004: checkout → webhook marks invoice paid → period opens

### F-012 14-day trial 🔴
Starts on provisioning; full plan features; in-app days-left banner; D-3/D-1 reminders (in-app + email); expiry → GRACE.
- US-003 AC: expiry → GRACE (read-only) → SUSPENDED (no login, data preserved) → pay → ACTIVE

### F-013 Webhook handler 🔴
Signature-verified, idempotent by event id, ordering by event time; unknown events logged (BR-011). Handles `payment.captured/failed`, `subscription.*`, `order.paid`.

### F-014 GST invoices 🔴
- US-005: INV-YYYY-NNNNN sequential (BR-013); platform GSTIN, tenant GSTIN, SAC/HSN, taxable, CGST+SGST intra-state / IGST inter-state (BR-012); server-side PDF (OpenHTMLtoPDF) stored on volume; downloadable from tenant billing + admin console.

### F-015 Plan change 🟠
Upgrade: prorated charge immediate. Downgrade: scheduled at renewal; over-quota tenants keep data, new creates blocked (D-062).

### F-016 Cancellation + offboarding 🔴
- US-008: cancel → CANCELLED at period end → OFFBOARDING: export ZIP (CSV per table + files) generated, link emailed → schema dropped at +30d; export id in audit log.

### F-017 Dunning 🔴
payment.failed/trial expiry → GRACE + notify → retry link; success → ACTIVE; fail → SUSPENDED → pay → reactivate.

## Module C — Plan Gating & Usage (NEW) — S1/S2

### F-020 Feature flags per plan 🔴
Client Portal & Labor Tracking: Pro+; Advanced Reports: Business+; White-label branding: Enterprise (D-060). API → 403 FEATURE_LOCKED → upsell screen.

### F-021 Usage limits 🔴
- US-006: counters (staff_users, projects, quotations_month, storage_mb, api_calls_day); at limit → 403 PLAN_LIMIT + upgrade prompt; atomic increment/decrement.

### F-022 Usage metering dashboard 🔴
Per-tenant meters + MRR in admin console (D-026).

## Module D — Platform Admin Console (NEW) — S1

### F-030 Platform login 🔴 — separate realm, public schema
### F-031 Tenant list/detail 🔴 — search name/slug, filter status/plan; detail: usage meters, subscription, invoices, actions
### F-032 Approvals UI 🔴 — approve/reject + reason
### F-033 Plan management UI 🟠
### F-034 Subscriptions + MRR dashboard 🔴
### F-035 Suspend/reactivate/offboard 🔴
### F-036 Platform settings 🟠 — platform GSTIN/state, reserved slugs, SMTP status
### F-037 PLATFORM_SUPPORT views 🟠 — read-only; mutations → 403
- US-007: tenant list searchable/filterable; detail shows usage, subscription, invoices, actions.

## Module E — Tenant Application (existing → tenant-scoped) — S2/S3

### F-040 Tenant auth 🔴 — login on subdomain; JWT tenant_id; invite acceptance (US-009); reset flow
### F-041 Role dashboards 🔴 — Owner/Admin/SiteMgr/Client
### F-042 Quotation engine 🔴 — packages, normalized stage lines/floor materials/electrical/extra works, print/PDF; QTN-YYYY-NNNNN (BR-022)
### F-043 Agreement generation 🔴 — A4 letterhead, payment schedule
### F-044 Project creation wizard 🔴 — from Signed quotation; blocks/units, stage % (copied template, editable, =100%), dates
### F-045 Site tracking 🔴 — 15 stages, expenses (approval), collections, budget alerts
### F-046 Labor 🔴 — workers, attendance (no future dates), advances, weekly payment summaries (approval), wages
### F-047 Material estimator 🔴 — 8 task types, history
### F-048 Material tracking 🔴 — project_materials status pipeline pending→ordered→delivered→installed
### F-049 Reports + CSV 🔴 — per-site/totals; advanced reports gated Business+
### F-050 Settings masters 🔴 — company, packages, materials, brands, stages template, extra works
### F-051 Client portal 🔴 (Pro+) — progress, payments, photos, change-request submit; blocked gracefully in grace/suspend
### F-052 Site photos 🔴 — upload to volume, gallery, stage-linked
### F-053 In-app notifications 🟠 — lifecycle + tenant events panel
### F-054 Tenant branding 🟠 — logo + accent color applied at runtime
### F-055 Tenant billing page 🔴 — US-010: plan, usage vs limits bars, invoices, upgrade (prorated checkout), downgrade-at-renewal, cancel + export offer

## Workflows (WF-01..09)
WF-01 signup→active · WF-02 trial→paid · WF-03 payment failure dunning · WF-04 offboard · WF-05 plan change · WF-06 quotation→project (one-way) · WF-07 invite · WF-08 client change request · WF-09 email verification at signup.

## Edge Cases
Unknown subdomain → generic not-found (no enumeration) · JWT/host mismatch → 403 · provisioning failure → PROVISION_FAILED + retry · webhook replay/out-of-order → idempotent · concurrent slug → unique constraint → friendly error · suspension mid-session → paywall on next request · deleted tenant → JWT invalid → logout.
