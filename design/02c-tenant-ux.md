# Phase 02c — Tenant UX & Admin Console Design

## 1. Tenant Selection
- **Mode: subdomain** (D-003). Tenant user logs in at `https://{slug}.elanjai.app`; dev = `{slug}.localhost:5173` or `?tenant=` / `X-Tenant-ID` fallback.
- No in-app tenant switcher for tenant users (one user = one tenant; cross-tenant is never allowed). Unknown slug → SCR-007 workspace-not-found.
- Platform admin console runs on `admin.*`; admins never "switch into" a tenant schema — they view tenant metadata + usage only (no read of tenant business data; BR-015/016).

## 2. Signup/Onboarding Sequence (public + tenant)

```
Signup (SCR-002) ──▶ Email verify (link) ──▶ Pending approval (SCR-003)
      │                                        │ admin approves
      ▼                                        ▼
 slug availability chip              PROVISIONING → TRIAL (welcome email)
                                              │ first login
                                              ▼
                                  Setup Wizard (SCR-036):
                                  ① company profile (name/address/phone/state)
                                  ② logo + accent color (live preview chip)
                                  ③ packages review (seeded basic/std/premium — edit rates)
                                  ④ stage template review (12 stages, % = 100)
                                  ⑤ done → Dashboard
```

## 3. Super-Admin Console IA (left sidebar)

```
▾ Dashboard      KPIs (MRR, tenants by status, pending, trials ending) + approvals strip
  Tenants        list → detail (usage meters, subscription, invoices, timeline, actions)
  Approvals      pending signups: company/slug/plan/verified badge → approve/reject+reason
  Plans          catalog cards (edit price/limits/flags) — Should
  Billing        subscriptions + invoices tables, MRR, payment-failure list
  Settings       platform GSTIN/state, reserved slugs, SMTP status — Should
  Audit Log      filterable platform events
                  SUPPORT role: identical views, all actions disabled (403-protected)
```

## 4. Tenant Branding Tokens
Applied at runtime on tenant realm; override **semantic aliases only**:

```
--tenant-logo-url      (navbar + login + printed docs)
--tenant-primary       → color.action.primary
--tenant-primary-hover → color.action.primary-hover
--tenant-favicon
```
Constraint: tenant-supplied accent is snapped to nearest accessible shade if contrast < 4.5:1 (WCAG AA preserved). No custom domains/fonts this release (D-060).

## 5. Lifecycle UX States
| Tenant state | UX |
|---|---|
| TRIAL | In-app banner "N days left · Upgrade" + D-3/D-1 reminders |
| GRACE | Read-only: writes blocked with toast "subscription grace — pay to resume edits"; portal clients see "temporarily unavailable" (BR-026/027) |
| SUSPENDED | Login → SCR-009 paywall + pay-now |
| PLAN_LIMIT | Inline upsell modal with usage bar + upgrade link |
| FEATURE_LOCKED | Upsell card naming the required plan |

## 6. Mobile-First Patterns (web-responsive; no native app)
- Bottom-thumb reach: primary action button fixed at bottom on small screens (attendance save, expense add)
- Lists → stacked cards; filters collapse to sheet; tables → card rows
- Touch targets ≥44px; photo upload uses camera capture (`accept="image/*" capture`)
- No offline mode (NFR); offline-error banner on network loss

## 7. Security UX
- Password field strength meter; lockout message after 5 fails; reset link 1h
- Invite acceptance: set-password screen with expiry notice
- No MFA this release (deferred); reCAPTCHA not included (rate-limit instead, D-011)

tenantUx block → `_ledger/design-system.json` (written in Phase 03 with full tokens).
