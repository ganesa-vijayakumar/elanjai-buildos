# Decisions Log — ElanjaiBuildos Multi-Tenant Conversion

**Total Decisions:** 64 (D-001..D-064) · **Duration:** Phase 00 → Phase 11
Source of truth: `_ledger/decisions.log` (append-only).

| # | Decision | Rationale | Phase |
|---|----------|-----------|-------|
| D-001 | Stages = requirement, design, development (skip estimation/proposal) | Internal product conversion | intake |
| D-002 | PostgreSQL + schema-per-tenant; migrate off MySQL | Stronger isolation; pipeline constraint | intake |
| D-003 | Subdomain tenant ID + X-Tenant header dev fallback | SaaS-standard URLs | intake |
| D-004 | Full Razorpay billing + 14-day trial on paid plans | Monetization day one | intake |
| D-005 | Hybrid onboarding: signup → approval → provisioning | Tenant quality control | intake |
| D-006 | Full super-admin console | Platform operations | intake |
| D-007 | Fresh start — no MySQL data migration | Existing data is demo | intake |
| D-008 | Port full App.tsx feature set, tenant-scoped | Feature parity | intake |
| D-009 | Local/dev deploy only (Docker Compose) | Cloud later | intake |
| D-010 | English only | Scope control | intake |
| D-011 | Rate limiting (bucket4j) | Public signup protection | intake |
| D-012 | Trial without card; pay at trial end | Low friction | 00 |
| D-013 | 7-day grace → full block; data preserved | Fairness + discipline | 00 |
| D-014 | Hard block + upgrade prompt at limits | Predictable enforcement | 00 |
| D-015 | Staff-only seat counting; clients free | SaaS standard | 00 |
| D-016 | Manual approval review | Simplest | 00 |
| D-017 | Offboard: ZIP export; delete at +30d | Standard export + bounded retention | 00 |
| D-018 | SMTP / Spring Mail | Provider-flexible | 00 |
| D-019 | Subdomain fixed; reserved list; no custom domains | Simple routing/SSL | 00 |
| D-020 | Monthly + yearly discounted billing | Matches business plan | 00 |
| D-021 | Razorpay test keys; real integration | Real webhook testing | 00 |
| D-022 | Full redesign of all screens | Design stage choice | 00 |
| D-023 | Business-plan pricing as plan catalog | Approved pricing | 00 |
| D-024 | Vision + objectives approved | North star | 01 |
| D-025 | Notifications: in-app + email | Timely comms | 01 |
| D-026 | Full usage metering in admin console | Billing/support visibility | 01 |
| D-027 | GST-compliant invoices | Indian B2B requirement | 01 |
| D-028 | PLATFORM_SUPPORT read-only role | Ops visibility | 02 |
| D-029 | Staff via email invite | Standard SaaS | 02 |
| D-030 | Client invited per project | Scoped access | 02 |
| D-031 | Setup wizard + seeded masters | Fast time-to-value | 02 |
| D-032 | Signup fields incl. optional GSTIN | Low friction | 02b |
| D-033 | Slug rules + reserved blocklist | DNS-safe | 02b |
| D-034 | Upgrade immediate prorated; downgrade at renewal | Standard semantics | 02b |
| D-035 | Single-region India Postgres | Right-sized | 02b |
| D-036 | Expense approval Owner/Admin only; only approved in reports | Matches model | 03 |
| D-037 | Grace = read-only (writes blocked) | Revenue enforcement | 03 |
| D-038 | Client portal graceful block in grace/suspend | No billing leakage to customers | 03 |
| D-039 | NFR set approved (50–500 users, <1.5s, p95 <500ms) | Right-sized | 04 |
| D-040 | Audit: platform + security events | Right-sized audit | 04 |
| D-041 | 99% + daily all-schema backups, 30d retention | Early-stage DR | 04 |
| D-042 | Accessibility best-effort | Cost-conscious | 04 |
| D-043 | Neutral SaaS theme (slate/indigo) + tenant accent | Modern baseline | 05 |
| D-044 | Light mode only | Simplicity | 05 |
| D-045 | Admin console left sidebar | Convention | 05 |
| D-046 | Public landing + pricing | Acquisition funnel | 05 |
| D-047 | Quotation customization fully normalized | Queryable | 06 |
| D-048 | Local volume storage; S3 adapter later | Dev simplicity | 06 |
| D-049 | One client per project | Matches design | 06 |
| D-050 | Stage template copied + editable (100%) | Governed flexibility | 06 |
| D-051 | Razorpay one-time payment per cycle (no mandates) | Simpler billing | 07 |
| D-052 | WhatsApp deferred | Email+in-app suffice | 07 |
| D-053 | Server-side GST invoice PDFs (OpenHTMLtoPDF) | Compliance documents | 07 |
| D-054 | No Tally/SMS OTP/maps | Scope control | 07 |
| D-055 | *.localhost dev subdomains + header fallback | Zero-config | 08 |
| D-056 | Spring Boot 4.x + Java 25 | Latest platform | 08 |
| D-057 | Mailpit in Compose | Dev email capture | 08 |
| D-058 | Remove App.tsx after port | Clean codebase | 08 |
| D-059 | Drop Mobile App + API gates from plan matrix | No unbuilt claims | 09 |
| D-060 | White-label = branding only | Custom domains deferred | 09 |
| D-061 | Email verification at signup; verified badge | Anti fake-signup | 09 |
| D-062 | Over-quota downgrade: keep data, block new creates | No forced deletion | 09 |
| D-063 | Minor gaps auto-resolved (BR-021..025) | Domain defaults | 09 |
| D-064 | MoSCoW + S1→S3 build slices approved | Foundation first | 10 |
