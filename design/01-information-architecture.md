# Phase 01 — Information Architecture

## 1. Sitemap

```mermaid
graph TD
    subgraph Public["🌐 Public (unauthenticated)"]
        L[SCR-001 Landing + Pricing] --> SG[SCR-002 Signup]
        SG --> PA[SCR-003 Pending Approval]
        SG --> VL[Email Verify Notice]
        L --> TL[SCR-004 Tenant Login]
        L --> AL[SCR-005 Admin Login]
        TL --> FP[SCR-006 Forgot/Reset]
        WNF[SCR-007 Workspace Not Found]
        IA[SCR-008 Invite Acceptance]
        PW[SCR-009 Paywall/Suspended]
    end

    subgraph Admin["🛠 Platform Console (admin.*) — left sidebar"]
        AD[SCR-010 Dashboard] --> TLs[SCR-011 Tenant List]
        TLs --> TD[SCR-012 Tenant Detail]
        AD --> AP[SCR-013 Approvals]
        AD --> PL[SCR-014 Plans]
        AD --> SB[SCR-015 Subscriptions/Invoices]
        AD --> PS[SCR-016 Platform Settings]
        AD --> AU[SCR-017 Audit Log]
    end

    subgraph Tenant["🏗 Tenant App (tenant.*) — top navbar + tabs"]
        DB[SCR-020 Dashboard]
        DB --> ST[SCR-023 Site Detail]
        DB --> QT[SCR-024 Quotation Builder]
        ST --> SC[SCR-027 Stages Config]
        DB --> LB[SCR-028 Labor]
        DB --> ME[SCR-029 Estimator]
        DB --> MT[SCR-030 Material Tracking]
        DB --> RP[SCR-031 Reports]
        DB --> SM[SCR-032 Settings Masters]
        DB --> US[SCR-033 Users & Invites]
        DB --> BL[SCR-034 Tenant Billing]
        DB --> BR[SCR-035 Branding]
        QT --> AG[SCR-025 Agreement]
        QT --> PJ[SCR-026 Project Wizard]
        SME[SCR-021 Site-Mgr Daily Entry]
        CP[SCR-022 Client Portal]
        SW[SCR-036 Setup Wizard]
        NT[SCR-037 Notifications]
    end
```

## 2. Navigation Models

| Realm | Model | Items |
|-------|-------|-------|
| Public | Top nav | Logo · Features · Pricing · Login · "Start Free Trial" CTA |
| Platform console | Left sidebar (D-045) | Dashboard, Tenants, Approvals, Plans, Subscriptions, Settings, Audit · top-right user menu |
| Tenant app | Top navbar + horizontal tabs | Navbar: tenant logo/name, tenant badge, notifications, user menu → Profile / Billing (Owner) / Logout. Tabs: Dashboard, Sites, Quotations, Labor, Materials, Reports, Settings (+ Portal view for clients) |

## 3. Role-Based Entry Flows

```mermaid
flowchart LR
    subgraph Signup["Signup → Active"]
        A[Signup form] --> B[Verify email] --> C[PENDING_APPROVAL] --> D{Admin}
        D -->|Approve| E[PROVISIONING → TRIAL] --> F[Welcome email] --> G[Setup wizard] --> H[Tenant dashboard]
        D -->|Reject| I[REJECTED + reason email]
    end
```

```mermaid
flowchart LR
    subgraph Owner["OWNER daily flow"]
        O1[Login tenant.*] --> O2[Dashboard]
        O2 --> O3[Approve expenses]
        O2 --> O4[Review reports]
        O2 --> O5[Billing: usage/invoices]
    end
    subgraph SiteMgr["SITE_MANAGER daily flow (mobile-first)"]
        M1[Login] --> M2[My sites]
        M2 --> M3[Mark attendance]
        M2 --> M4[Log materials/expense]
        M2 --> M5[Upload photos]
    end
    subgraph Client["CLIENT flow"]
        C1[Invite link → set password] --> C2[Portal: own project]
        C2 --> C3[Progress + payments + photos]
        C2 --> C4[Submit change request]
    end
    subgraph AdminFlow["PLATFORM_ADMIN flow"]
        P1[Admin login] --> P2[Dashboard: pending approvals, trials ending]
        P2 --> P3[Approve/reject signups]
        P2 --> P4[Tenant detail → suspend/offboard]
        P2 --> P5[Plans / subscriptions / audit]
    end
```

## 4. Route Map (for dev)

```
Public:        /  /pricing  /signup  /login  /admin/login  /forgot-password  /invite/:token  /suspended
Platform:      /admin → dashboard  /admin/tenants  /admin/tenants/:id  /admin/approvals
               /admin/plans  /admin/billing  /admin/settings  /admin/audit
Tenant:        /dashboard  /sites  /sites/:id  /quotations  /quotations/:id  /quotations/new
               /labor  /materials  /reports  /settings  /users  /billing  /branding
               /wizard  /notifications  /portal (client)
Dev fallback:  ?tenant=<slug> or X-Tenant-ID header
```

**⏸️ Checkpoint:** IA sitemap, navigation models, and role flows as above.
