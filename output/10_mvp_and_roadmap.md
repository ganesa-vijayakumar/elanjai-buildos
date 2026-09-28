# MVP & Roadmap — ElanjaiBuildos

## MVP Goal Statement
The MVP lets a builder self-register, get approved, trial the full workspace for 14 days, pay via Razorpay, and run their complete quotation→project→payment workflow in an isolated tenant — while Elanjai operates tenants/billing from the admin console.

## MoSCoW Summary

| Bucket | Features |
|--------|----------|
| 🔴 Must (28) | F-001..006, F-010..014, F-016..017, F-020..022, F-030..032, F-034..035, F-040..046, F-049..052, F-055 + landing/pricing |
| 🟠 Should (6) | F-015 plan-change proration UI, F-033 plan editor, F-036 platform settings, F-037 support views, F-053 notifications, F-054 branding runtime |
| ⚪ Won't (release 1) | custom domains, WhatsApp, mobile app, public API, Tally, MFA, i18n, dark mode, multi-region |

## Build Slices (approved order, D-064)

### S1 — Platform Foundation
Postgres + Flyway dual-track · tenant resolver (subdomain/header) · JWT realms · signup→approval→provisioning· lifecycle engine · usage counters + gating · admin console core · Razorpay billing + webhooks + GST PDFs · landing/signup/login pages.

### S2 — Tenant Core
Tenant auth + invites · role dashboards · quotation engine + agreement · project wizard + stages · expenses + collections + approvals · settings masters · materials spent · users · tenant billing page.

### S3 — Extended Tenant Features
Labor attendance/wages/advances · material estimator + tracking · reports + CSV · client portal + change requests · photos · in-app notifications · tenant branding runtime.

## Release Gates
- S1 done = platform can onboard a real tenant end-to-end (signup→pay)
- S2 done = tenant runs core construction workflow
- S3 done = full feature parity with legacy app → `App.tsx` removed (D-058)
- Final verification: tenant-isolation tests, E2E flows, build/lint, docker compose up
