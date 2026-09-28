# Phase 02 — Wireframes (mobile-first 375px → desktop notes)

Greyscale structural layouts. State legend applies to every screen: `loading` = skeleton rows; `empty` = icon + headline + CTA; `error` = inline banner + retry; `denied` = upsell/no-access panel; `pending` = button spinner + disabled form; `destructive` = confirm dialog w/ typed reason where required.

## PUBLIC REALM

### SCR-001 Landing + Pricing (375px)
```
┌─────────────────────────┐
│ [logo] Elanjai    Login │ ← sticky top nav; [Start Free] btn
├─────────────────────────┤
│ HERO                    │
│ "Run your construction  │
│  business in one place" │
│ subcopy · [Start Free Trial]
│ [demo screenshot block] │
├─────────────────────────┤
│ FEATURES grid (2-col → 4 desktop)
│ quotation/project/labor │
│ /materials/portal/reports
├─────────────────────────┤
│ PRICING — 4 cards stacked→row
│ Starter ₹1,499 · Pro ₹2,999★
│ Business ₹4,999 · Enterprise
│ limits bullets · [Choose] │
├─────────────────────────┤
│ footer: links · contact │
└─────────────────────────┘
```
States: loading n/a (static) · error → n/a · empty n/a.

### SCR-002 Signup (375px)
```
┌─────────────────────────┐
│ Create your workspace   │
│ ── Company ──           │
│ [Company name________]  │
│ [Subdomain __].elanjai..│ ← live availability ✓/✗ chip
│ [GSTIN (optional)____]  │
│ ── Owner ──             │
│ [Name][Email][Phone]    │
│ [Password______][strength]
│ ── Plan ──              │
│ ○Starter ○Pro ○Biz ○Ent │ ← selectable cards
│ [Create workspace ▸]    │
│ already have? Login →   │
└─────────────────────────┘
```
States: pending (button spinner, form locked) · error (top banner for slug/email; inline per-field) · denied (rate-limit → "try later") · empty n/a.

### SCR-003 Pending approval / SCR-009 Paywall (375px)
```
┌─────────────────────────┐
│        [icon]           │
│  "We're reviewing your  │
│   workspace request"    │
│  status timeline:       │
│  ✓submitted ✓verified ⏳review
│  [Contact support]      │
└─────────────────────────┘
   SCR-009 variant:
│  "Subscription inactive"│
│  days-left in grace bar │
│  [Pay now] [Contact]    │
```
States: both show pending-info; paywall adds payment CTA + destructive-confirm for cancel.

### SCR-004/005 Login (tenant & admin)
```
┌─────────────────────────┐
│ [tenant logo/name]      │ ← admin variant: Elanjai mark
│ Sign in to <slug>       │
│ [Email_______________]  │
│ [Password____________]  │
│ [Sign in ▸]             │
│ Forgot password?        │
└─────────────────────────┘
```
States: pending (spinner) · error (invalid creds banner; lockout after 5) · denied (wrong realm → "no tenant account here" hint).

## PLATFORM CONSOLE (sidebar)

### SCR-010 Admin Dashboard (375px → desktop)
```
Mobile:                 Desktop:
┌──────────────┐   ┌────┬───────────────────┐
│ ☰ Admin      │   │side│ KPI cards ×4      │
│ [MRR ₹xx]    │   │ bar│ MRR · Tenants ·   │
│ [Tenants n]  │   │    │ Pending · Trials  │
│ [Pending n]  │   │Dash│ ┌───────────────┐ │
│ [Trials n]   │   │Ten │ │Approvals (5)  │ │
│ Approvals ▸  │   │App │ │ name slug plan│ │
│ Trials exp.▸ │   │Plan│ │ [view]        │ │
│              │   │Sub │ ├───────────────┤ │
│              │   │Set │ │Tenants table→ │ │
│              │   │Aud │ │ cards mobile  │ │
└──────────────┘   └────┴───────────────────┘
```
States: loading skeletons · empty ("no pending approvals") · error banner.

### SCR-012 Tenant Detail
```
┌─────────────────────────┐
│ ◀ Acme Builders [ACTIVE]│
│ slug · plan chip · since│
│ ┌─ usage meters ───────┐│
│ │ users ▓▓░░ 4/5       ││
│ │ projects ▓░ 12/20    ││
│ │ quotes/mo ▓▓ 41/50   ││
│ │ storage ▓ 6.2/10 GB  ││
│ └──────────────────────┘│
│ subscription card       │
│ invoices table          │
│ [Suspend][Offboard]     │ ← destructive confirm w/ reason
└─────────────────────────┘
```
States: loading · error · destructive-confirm (suspend/offboard require typed reason) · denied (SUPPORT sees disabled buttons + tooltip).

## TENANT REALM

### SCR-020 Tenant Dashboard
```
┌─────────────────────────┐
│ [logo] Acme     🔔  ▾   │ ← trial banner when TRIAL: "11 days left — Upgrade"
├─────────────────────────┤
│ KPI row: active sites · │
│ pending approvals ·     │
│ collections this month  │
│ ┌─Sites───────────────┐ │
│ │ name stage % status │ │
│ ├─Pending approvals──┐ │ │
│ │ expenses n · [go]  │ │ │
│ ├─Recent activity───┐ │ │
└─────────────────────────┘
```
States: loading · empty ("create your first site") · denied (client → portal view instead).

### SCR-024 Quotation Builder (multi-step)
```
Stepper: ①Client ②Package ③Details ④Review
┌─────────────────────────┐
│ ② Package               │
│ ○ Basic ₹/sqft          │
│ ● Standard ₹/sqft       │
│ ○ Premium ₹/sqft        │
│ ── auto total card ──   │
│ area × rate = ₹ total   │
│ [◀ Back] [Next ▶]       │
└─────────────────────────┘
 ③ Details: stage lines table (add/remove, % =100 validator)
   floor materials accordion · electrical rooms grid · extras checklist
 ④ Review → [Finalize] [Print/PDF]
```
States: pending (finalize spinner) · error (validation: %≠100 inline) · destructive (cancel quotation confirm) · empty (no extras selected → section collapses).

### SCR-021 Site-Manager Daily Entry (mobile-first)
```
┌─────────────────────────┐
│ ◀ Site: Villa 42        │
│ [Today ▾ date]          │
│ ┌ tabs ────────────────┐│
│ │Attendance|Materials| ││
│ │Expense   |Photos   | ││
│ └──────────────────────┘│
│ worker list w/ toggles: │
│ Kumar   [P|½|A] ₹850    │
│ Raja    [P|½|A] ₹700    │
│ [Save attendance]       │
└─────────────────────────┘
```
States: loading · error (save fail → retry keeps local state) · denied (not assigned site) · pending (save spinner).

### SCR-022 Client Portal
```
┌─────────────────────────┐
│ My Project: Villa 42    │
│ progress bar 62%        │
│ current stage chip      │
│ ┌─Payments────────────┐ │
│ │ due / paid timeline │ │
│ ├─Photos (gallery)───┐ │ │
│ ├─[Submit change req]│ │ │
└─────────────────────────┘
```
States: empty (no photos yet) · denied/grace ("temporarily unavailable" — BR-027) · pending (CR submit).

### SCR-034 Tenant Billing
```
┌─────────────────────────┐
│ Current plan: Pro ₹2999 │
│ next billing: Oct 27    │
│ usage bars (4)          │
│ invoices table + PDF ⤓  │
│ [Upgrade] [Cancel]      │
└─────────────────────────┘
```
States: loading · pending (checkout redirect) · destructive (cancel → reason + export offer) · empty (no invoices).

## SHARED PATTERNS (all remaining screens)
- **List/table screens** (SCR-011,015,023,028,029,030,031,032,033,037): toolbar (search + filter + primary action) → table; mobile = stacked cards; states: loading skeleton, empty+CTA, error retry, pagination 25/pg.
- **Form screens** (SCR-026,035,036): single-column mobile, 2-col ≥768px; stepper for wizards; pending/error states on submit.
- **Detail screens** (SCR-023,012): header + KPI/meter strip + tabbed sections.

**⏸️ Checkpoint:** approve structure before visual design (Phase 03 design system).
