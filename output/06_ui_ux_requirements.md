# UI/UX Requirements — ElanjaiBuildos

## Design Language
- **Theme:** New neutral SaaS theme — slate/indigo, Stripe/Linear-style (D-043). Light mode only (D-044).
- **Tenant branding:** accent-color + logo override applied at runtime per tenant (F-054).
- **Responsive:** fully responsive; mobile-first for site-manager daily-entry flows.
- **Accessibility:** best-effort semantic HTML + keyboard nav.

## Navigation
- **Public:** landing nav → pricing → signup → login
- **Platform console:** left sidebar (Dashboard, Tenants, Approvals, Plans, Subscriptions, Settings, Audit) (D-045)
- **Tenant app:** top navbar (tenant logo + name) + tab nav; user menu → profile, billing (Owner), logout

## Screen Inventory (SCR-###)

### Public (unauthenticated)
| ID | Screen | Purpose |
|----|--------|---------|
| SCR-001 | Landing + pricing | Marketing, plan table, signup CTA |
| SCR-002 | Tenant signup | company/owner/email/phone/password/slug+availability/plan picker/GSTIN |
| SCR-003 | Pending approval | Confirmation + "check email" state |
| SCR-004 | Tenant login | On tenant subdomain |
| SCR-005 | Platform admin login | admin subdomain |
| SCR-006 | Forgot/reset password | 1h single-use link |
| SCR-007 | Workspace not found | Unknown subdomain, no tenant enumeration |
| SCR-008 | Invite acceptance | Set password (72h link) |
| SCR-009 | Paywall / suspended | Grace/suspended notice + pay-now |

### Platform console (PLATFORM_ADMIN/SUPPORT)
| ID | Screen | Purpose |
|----|--------|---------|
| SCR-010 | Dashboard | MRR, tenants by status/plan, pending approvals, trials ending |
| SCR-011 | Tenant list | Search name/slug, filter status/plan |
| SCR-012 | Tenant detail | Usage meters, subscription, invoices, actions |
| SCR-013 | Approvals queue | Approve/reject + reason, verified badge |
| SCR-014 | Plan management | Catalog CRUD |
| SCR-015 | Subscriptions & invoices | Filter status/date |
| SCR-016 | Platform settings | GSTIN/state, reserved slugs, SMTP status |
| SCR-017 | Audit log | Platform + security events |

### Tenant app
| ID | Screen | Purpose |
|----|--------|---------|
| SCR-020 | Dashboard | Role-specific: Owner/Admin/SiteMgr |
| SCR-021 | Site-mgr daily entry | Attendance/materials/expenses/photos, mobile-first |
| SCR-022 | Client portal | Progress, payments, photos, change requests (Pro+; graceful block in grace/suspend) |
| SCR-023 | Site detail | Stages, expenses, collections, photos, alerts |
| SCR-024 | Quotation builder | Packages, stage lines, floor materials, electrical, extras; print/PDF |
| SCR-025 | Agreement | A4 letterhead preview/print |
| SCR-026 | Project wizard | From signed quotation: blocks/units, stage %, dates |
| SCR-027 | Stages config | Editable stage % (=100), status, dates |
| SCR-028 | Labor | Workers, attendance, advances, payments (4 tabs) |
| SCR-029 | Material estimator | 8 task types + history |
| SCR-030 | Material tracking | Specified vs actual, status pipeline |
| SCR-031 | Reports | Site/total reports + CSV; advanced gated Business+ |
| SCR-032 | Settings masters | Company, packages, materials, brands, stages, extra works |
| SCR-033 | Users & invites | Invite staff/client, roles, deactivate |
| SCR-034 | Tenant billing | Plan, usage bars, invoices, upgrade/cancel (Owner) |
| SCR-035 | Branding | Logo + accent color |
| SCR-036 | Setup wizard | First-login company/logo/packages |
| SCR-037 | Notifications | In-app panel |

## Dialogs
Invite user · delete/confirm · expense/collection entry · worker/advance · photo upload · change request · cancel-subscription confirm · upgrade checkout · PLAN_LIMIT upsell · approve/reject with reason.
