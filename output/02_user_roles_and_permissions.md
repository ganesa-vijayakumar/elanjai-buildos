# User Roles & Permissions — ElanjaiBuildos

## Roles

| ID | Role | Realm | Description |
|----|------|-------|-------------|
| ROLE-01 | PLATFORM_ADMIN | public | Full platform control: approvals, plans, subscriptions, suspend/offboard, settings, audit. |
| ROLE-02 | PLATFORM_SUPPORT | public | Read-only: tenant health, usage, billing status. Mutations rejected (403). |
| ROLE-03 | OWNER | tenant | Full tenant access incl. billing page, branding, users, settings masters, subscription mgmt. |
| ROLE-04 | ADMIN | tenant | Operational control: projects, quotations, labor, materials, reports, invites, settings. No billing. |
| ROLE-05 | SITE_MANAGER | tenant | Daily site entries (attendance, materials, expenses, photos) on assigned sites. |
| ROLE-06 | CLIENT | tenant | Read-only own-project portal + change-request submit. Invited per project. Free seat. |

## Permission Matrix (tenant scope)

| Feature / Action | Owner | Admin | Site Mgr | Client |
|---|---|---|---|---|
| Dashboard | ✅ | ✅ | ✅ assigned | ✅ own project |
| Quotations CRUD | ✅ | ✅ | ❌ | ❌ |
| Convert quotation → project | ✅ | ✅ | ❌ | ❌ |
| Daily entries (labor/material/expense/photos) | ✅ | ✅ | ✅ | ❌ |
| Approve expenses / payments | ✅ | ✅ | ❌ | ❌ |
| Labor mgmt + wages | ✅ | ✅ | mark only | ❌ |
| Material estimator / tracking | ✅ | ✅ | ✅ | ❌ |
| Reports + CSV export | ✅ | ✅ | ❌ | ❌ |
| Settings masters | ✅ | ✅ | ❌ | ❌ |
| User management / invites | ✅ | ✅ | ❌ | ❌ |
| Billing / subscription | ✅ | ❌ | ❌ | ❌ |
| Branding settings | ✅ | ❌ | ❌ | ❌ |
| Client portal (read) / change request | — | — | — | ✅ / submit |

Platform scope: PLATFORM_ADMIN all; PLATFORM_SUPPORT read-only equivalent of admin views.

## Auth Requirements
- Platform users: `platform_users` in public schema; login at admin console; JWT realm=platform
- Tenant users: `users` in `t_<slug>`; login on tenant subdomain; JWT carries tenant_id + role
- Email unique per tenant (not global); same email may exist across tenants
- Staff invite: email link (72h, single-use) → set password → active
- Client invite: per project (sites.client_user_id); invited by Owner/Admin
- Password ≥8 chars; lockout after 5 fails; reset link 1h single-use; JWT 24h
- Email verification at signup; admin sees verified badge (D-061)
