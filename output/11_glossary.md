# Glossary — ElanjaiBuildos

| Term | Definition | Context |
|------|-----------|---------|
| Tenant | A builder company with an isolated `t_<slug>` schema and subdomain | Platform model |
| Slug | DNS-safe tenant identifier (3–30 `[a-z0-9-]`), immutable | Signup, routing |
| Schema-per-tenant | Each tenant gets its own Postgres schema; `public` holds platform data | Isolation |
| Trial | 14-day full-feature evaluation starting at provisioning | Lifecycle |
| Grace | 7-day read-only period after payment failure/trial expiry | Lifecycle |
| Suspended | Login blocked; data preserved; pay to reactivate | Lifecycle |
| Offboarding | Export ZIP (CSV+files) generated; schema dropped after 30d | Lifecycle |
| Staff seat | Owner/Admin/SiteManager users counted against plan limit | Billing |
| Client | Tenant's customer; project-scoped portal; free seat | Roles |
| Plan | Subscription tier with price + limits + feature flags | Billing |
| Feature flag | Per-plan gate (client portal, labor, adv. reports, white-label) | Gating |
| Usage counter | Per-tenant metric (users, projects, quotations/mo, storage, API calls) | Metering |
| PLAN_LIMIT | 403 error + upgrade prompt when a limit is hit | Enforcement |
| FEATURE_LOCKED | 403 error when plan lacks a feature gate | Enforcement |
| Provisioning | Creating `t_<slug>` schema + Flyway tenant migrations + seed | Onboarding |
| Stage template | Default construction stages (%, days) copied to each project | Tenant domain |
| Quotation | Priced proposal; QTN-YYYY-NNNNN; Draft→…→Converted | Tenant domain |
| Collection | Client payment receipt against a site/stage | Tenant domain |
| Expense | Site cost entry; requires Owner/Admin approval | Tenant domain |
| MRR | Monthly recurring revenue across tenants | Platform console |
| Dunning | Payment-failure recovery flow (reminders → grace → suspend) | Billing |
| GST/GSTIN | Indian tax ID; invoices carry platform+tenant GSTIN, SAC/HSN, CGST/SGST/IGST | Compliance |
| Mailpit | Dev SMTP capture container | Dev tooling |
| Realm | JWT audience: `platform` vs `tenant` token | Auth |
