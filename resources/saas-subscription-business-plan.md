# Elanjai Buildos - SaaS Subscription Model Business Plan
## Multi-Tenant Construction Management Platform

> **Business Model**: Subscription-based SaaS for Construction Builders
> **Target Market**: Small to Medium Construction Builders in India
> **Generated**: January 30, 2026

---

## 📊 Executive Summary

### The Opportunity

| Metric | Value |
|--------|-------|
| **Registered Builders in India** | 50,000+ (CREDAI members alone) |
| **Small/Medium Builders** | 80% of market |
| **Digital Adoption Rate** | Growing 25% YoY |
| **Existing Solutions** | Expensive ($50-200/month) or too complex |

### The Proposition

Build **ONE complete platform** and sell subscriptions to **MANY builders** instead of building custom solutions for each client.

| Approach | One-Time Client | SaaS Product |
|----------|-----------------|--------------|
| Revenue per client | ₹2-3L once | ₹2-5K/month recurring |
| 50 clients revenue | ₹1-1.5 Cr (years to get) | ₹10-25L/month |
| Your effort per client | 100% | ~5% (onboarding only) |
| Scalability | Linear (trade time for money) | Exponential |

---

## ✅ Go-Forward Recommendation: **BUILD THE SAAS**

### Why This Makes Sense

| Factor | Analysis |
|--------|----------|
| **Market Gap** | Most tools are for large builders. Small builders use Excel/WhatsApp |
| **Your Advantage** | You already have 80% of the UI built! |
| **Recurring Revenue** | Monthly income vs one-time payments |
| **Portfolio Asset** | Own a product, not just freelance |
| **Scalability** | One codebase serves hundreds of builders |

---

## 🏗️ Multi-Tenant SaaS Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                    TENANT AWARE FRONTEND                              │
│            builder1.elanjai.app | builder2.elanjai.app                 │
│                    OR elanjai.app/builder1                             │
└──────────────────────────────┬───────────────────────────────────────┘
                               │ HTTPS + JWT (Tenant ID in token)
┌──────────────────────────────▼───────────────────────────────────────┐
│                         API GATEWAY                                   │
│              Rate Limiting | Tenant Routing | Auth                    │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
    ┌──────────────────────────┼──────────────────────────┐
    │                          │                          │
┌───▼───────┐  ┌───────────────▼───────────────┐  ┌──────▼──────┐
│   Auth    │  │      Core Business Services   │  │ Subscription│
│  Service  │  │  Projects | Quotations | Labor│  │   Service   │
└─────┬─────┘  └───────────────┬───────────────┘  └──────┬──────┘
      │                        │                          │
      └────────────────────────┼──────────────────────────┘
                               │
              ┌────────────────▼────────────────┐
              │     MySQL (Multi-Tenant DB)     │
              │   tenant_id in every table      │
              │   OR separate DB per tenant     │
              └─────────────────────────────────┘
```

### Multi-Tenancy Strategy

| Approach | Pros | Cons | Use When |
|----------|------|------|----------|
| **Shared DB + tenant_id** | Simple, cost-effective | Data isolation risk | < 100 tenants |
| **DB per tenant** | Full isolation, easy backup | Higher cost | > 100 tenants |
| **Hybrid** | Balance of both | Complex | Best for scaling |

**Recommendation**: Start with **Shared DB + tenant_id**, migrate to **DB per tenant** as you scale.

---

## 📦 Complete Feature Set (All Phases)

### Phase 1: Core MVP (Month 1-3)

| Module | Features |
|--------|----------|
| **Multi-Tenant Auth** | Tenant registration, User management, Role-based access |
| **Tenant Dashboard** | KPIs, Project overview, Quick actions |
| **Project Management** | CRUD, Stage tracking, Status updates |
| **Quotation Engine** | Package selection, Pricing, PDF generation |
| **Payment Tracking** | Collection entry, Stage-wise payments, Pending alerts |
| **Agreement PDF** | Generate formal construction agreements |
| **Basic Reports** | 5 essential reports |
| **Settings** | Company profile, Package rates, Branding |

### Phase 2: Growth Features (Month 4-5)

| Module | Features |
|--------|----------|
| **Labor & Attendance** | Worker management, Daily attendance, Wage calculation |
| **Material Estimator** | 8 construction task calculators |
| **Client Portal** | Read-only access for clients with login |
| **Photo Gallery** | Site photos with cloud storage |
| **Notifications** | Email + WhatsApp alerts |

### Phase 3: Premium Features (Month 6-7)

| Module | Features |
|--------|----------|
| **Advanced Reports** | Custom reports, Export to Excel |
| **Change Requests** | Client change management workflow |
| **Expense Tracking** | Detailed expense categorization |
| **Inventory Tracking** | Material stock management |
| **Mobile App** | React Native app for site managers |

### Phase 4: Enterprise Features (Month 8+)

| Module | Features |
|--------|----------|
| **API Access** | For integrations |
| **Custom Branding** | White-label option |
| **Multi-branch** | Multiple offices under one account |
| **Advanced Analytics** | BI dashboards |
| **Audit Logs** | Compliance tracking |

---

## ⏱️ Development Timeline

### Complete Platform Build

| Phase | Duration | Hours | Key Deliverables |
|-------|----------|-------|------------------|
| **Phase 0: Planning** | 2 weeks | 40 | Architecture, DB design, API specs |
| **Phase 1: Core MVP** | 10 weeks | 200 | Auth, Dashboard, Projects, Quotations, Payments |
| **Phase 2: Growth** | 6 weeks | 120 | Labor, Estimator, Client Portal |
| **Phase 3: Premium** | 6 weeks | 120 | Reports, Expenses, Mobile App |
| **Phase 4: Enterprise** | 8 weeks | 160 | API, White-label, Analytics |
| **TOTAL** | **32 weeks** | **640 hours** |

### At 4 hours/day

| Working Days | Calendar Duration |
|--------------|-------------------|
| 160 days | ~8 months |

### Recommended MVP Launch Strategy

| Milestone | Week | What to Launch |
|-----------|------|----------------|
| **Alpha** | Week 12 | Core MVP (Phase 1) - Internal testing |
| **Beta** | Week 16 | Invite 5 builders for free trial |
| **Launch v1.0** | Week 20 | Public launch with Phase 1+2 |
| **v2.0** | Week 28 | Premium features added |

---

## 💰 Investment & Cost Analysis

### A. Development Investment

| Category | Hours | Rate (₹/hr) | Cost (INR) |
|----------|-------|-------------|------------|
| Phase 0: Planning | 40 | 800 | ₹32,000 |
| Phase 1: Core MVP | 200 | 800 | ₹1,60,000 |
| Phase 2: Growth | 120 | 800 | ₹96,000 |
| Phase 3: Premium | 120 | 800 | ₹96,000 |
| Phase 4: Enterprise | 160 | 800 | ₹1,28,000 |
| **Development Total** | **640** | | **₹5,12,000** |

### B. Your Personal Investment (While Building)

| Item | Monthly | 8 Months |
|------|---------|----------|
| AI Tools (Copilot, Claude) | ₹3,000 | ₹24,000 |
| Development Hosting | ₹2,000 | ₹16,000 |
| Domain + SSL | ₹200 | ₹1,600 |
| Misc (Testing, APIs) | ₹1,500 | ₹12,000 |
| **Personal Investment** | | **₹53,600** |

### C. Production Infrastructure (Monthly)

| Component | Startup (10 tenants) | Growth (50 tenants) | Scale (200 tenants) |
|-----------|----------------------|---------------------|---------------------|
| App Servers | ₹3,000 | ₹6,000 | ₹15,000 |
| Database | ₹2,000 | ₹4,000 | ₹10,000 |
| Storage (Photos) | ₹500 | ₹2,000 | ₹8,000 |
| CDN | ₹500 | ₹1,000 | ₹3,000 |
| Email/SMS | ₹500 | ₹2,000 | ₹5,000 |
| Monitoring | ₹500 | ₹1,000 | ₹2,000 |
| **Monthly Total** | **₹7,000** | **₹16,000** | **₹43,000** |

### D. Total First Year Investment

| Category | Cost (INR) |
|----------|------------|
| Development (Your Time Value) | ₹5,12,000 |
| Personal Investment (8 months) | ₹53,600 |
| Production Hosting (12 months) | ₹84,000 - ₹1,92,000 |
| Marketing Budget | ₹50,000 |
| Legal (Terms, Privacy) | ₹15,000 |
| **TOTAL INVESTMENT** | **₹7,15,000 - ₹8,22,000** |

**Reality Check**: If you don't count your time as "cost" (you're investing it for equity), your actual cash investment is only **₹2-3 Lakhs** for the first year.

---

## 💵 Subscription Pricing Strategy

### Pricing Tiers

| Plan | Price/Month | Price/Year | Target Segment |
|------|-------------|------------|----------------|
| **Starter** | ₹1,499 | ₹14,990 (Save ₹3K) | 1-5 active projects |
| **Professional** | ₹2,999 | ₹29,990 (Save ₹6K) | 5-20 projects |
| **Business** | ₹4,999 | ₹49,990 (Save ₹10K) | 20-50 projects |
| **Enterprise** | ₹9,999+ | Custom | 50+ projects |

### Feature Matrix

| Feature | Starter | Professional | Business | Enterprise |
|---------|---------|--------------|----------|------------|
| Active Projects | 5 | 20 | 50 | Unlimited |
| Users | 2 | 5 | 15 | Unlimited |
| Quotations/month | 10 | 50 | 200 | Unlimited |
| Storage | 2 GB | 10 GB | 50 GB | 200 GB |
| Client Portal | ❌ | ✅ | ✅ | ✅ |
| Labor Tracking | ❌ | ✅ | ✅ | ✅ |
| Advanced Reports | ❌ | ❌ | ✅ | ✅ |
| Mobile App | ❌ | ✅ | ✅ | ✅ |
| API Access | ❌ | ❌ | ❌ | ✅ |
| White-label | ❌ | ❌ | ❌ | ✅ |
| Support | Email | Email + Chat | Priority | Dedicated |

---

## 📈 Revenue Projections

### Monthly Recurring Revenue (MRR) Growth Model

| Month | New Customers | Churn | Total Customers | Avg Plan (INR) | MRR (INR) |
|-------|---------------|-------|-----------------|----------------|-----------|
| 1 | 3 | 0 | 3 | 2,000 | ₹6,000 |
| 2 | 5 | 0 | 8 | 2,000 | ₹16,000 |
| 3 | 5 | 1 | 12 | 2,200 | ₹26,400 |
| 4 | 7 | 1 | 18 | 2,200 | ₹39,600 |
| 5 | 8 | 1 | 25 | 2,300 | ₹57,500 |
| 6 | 10 | 2 | 33 | 2,400 | ₹79,200 |
| 9 | 12 | 3 | 55 | 2,500 | ₹1,37,500 |
| 12 | 15 | 4 | 80 | 2,600 | ₹2,08,000 |

### Yearly Summary

| Metric | Year 1 | Year 2 | Year 3 |
|--------|--------|--------|--------|
| **Customers (EOY)** | 80 | 200 | 500 |
| **MRR (EOY)** | ₹2.08L | ₹5.5L | ₹14L |
| **ARR (Annual)** | ₹25L | ₹66L | ₹1.68 Cr |
| **Gross Revenue** | ₹15L | ₹50L | ₹1.2 Cr |
| **Expenses** | ₹10L | ₹20L | ₹40L |
| **Net Profit** | ₹5L | ₹30L | ₹80L |

---

## 📊 Break-Even Analysis

### Fixed Costs (Monthly)

| Item | Cost (INR) |
|------|------------|
| Hosting Infrastructure | ₹10,000 |
| AI Tools & Software | ₹3,000 |
| Marketing | ₹5,000 |
| Miscellaneous | ₹2,000 |
| **Total Fixed** | **₹20,000** |

### Break-Even Calculation

| Metric | Value |
|--------|-------|
| Average Revenue Per User (ARPU) | ₹2,500/month |
| Cost Per Customer (Hosting) | ₹300/month |
| **Contribution Margin** | ₹2,200/month |
| **Break-Even Customers** | ₹20,000 ÷ ₹2,200 = **10 customers** |

> **You break even with just 10 paying customers!**

### Time to Break-Even

| Scenario | Customers Needed | Time to Reach |
|----------|------------------|---------------|
| Conservative | 10 | Month 3-4 |
| Moderate | 25 | Month 5-6 |
| Aggressive | 50 | Month 8-10 |

---

## 🎯 Go-To-Market Strategy

### Phase 1: Beta Launch (Month 1-2)

| Activity | Details |
|----------|---------|
| **Target** | 10 builders from your network |
| **Offer** | 3 months FREE (in exchange for feedback) |
| **Goal** | Validate product, get testimonials |

### Phase 2: Soft Launch (Month 3-4)

| Activity | Details |
|----------|---------|
| **Pricing** | Full pricing starts |
| **Offer** | 50% off annual plans for early adopters |
| **Channels** | WhatsApp groups, LinkedIn, Construction forums |

### Phase 3: Scale (Month 5+)

| Channel | Strategy |
|---------|----------|
| **Content** | Blog posts, YouTube tutorials on construction management |
| **Partnerships** | Tie-ups with material suppliers, banks |
| **Referrals** | ₹500 credit for each referral |
| **Paid Ads** | Google/Facebook targeting "construction software" |

---

## ⚠️ Risk Analysis

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Low adoption | Medium | High | Start with FREE beta, prove value |
| Competition | Low | Medium | Focus on vernacular (Tamil), local support |
| Churn | Medium | Medium | Focus on onboarding, success team |
| Technical debt | Medium | Low | Clean architecture from day 1 |
| Cash flow | High | High | Get annual prepayments |

---

## ✅ Comparison: One-Time Client vs SaaS

| Factor | One Client (₹3L) | SaaS (100 subscribers) |
|--------|-------------------|------------------------|
| **Initial Revenue** | ₹3,00,000 | ₹0 (building phase) |
| **Month 6 Revenue** | ₹0 (project done) | ₹80,000/month |
| **Year 1 Total** | ₹3,00,000 + maintenance | ₹15-25,00,000 |
| **Year 2 Total** | New client needed | ₹50-70,00,000 |
| **Year 3 Total** | New client needed | ₹1-1.5 Crore |
| **Work per customer** | 100% | ~5% |
| **Business Value** | ₹0 (services) | ₹5-10 Cr (sellable asset) |

---

## 🚀 Recommended Action Plan

### Immediate Next Steps

| Step | Action | Timeline |
|------|--------|----------|
| 1 | Validate demand - Talk to 10 builders | Week 1-2 |
| 2 | Finalize feature scope for MVP | Week 2 |
| 3 | Set up multi-tenant architecture | Week 3-4 |
| 4 | Start building Phase 1 | Week 5+ |
| 5 | Recruit 5 beta testers | Week 10 |
| 6 | Launch beta | Week 12 |

### Funding Options (If Needed)

| Source | Amount | Terms |
|--------|--------|-------|
| Self-funded | ₹2-3L | Your investment |
| Friends/Family | ₹2-5L | Soft loan |
| Revenue-based | - | Get 3 annual prepayments |
| Micro VC | ₹10-25L | 10-15% equity |

---

## 📋 Final Recommendation

### **BUILD THE SAAS** ✅

| If You Go One-Time Client | If You Go SaaS |
|---------------------------|----------------|
| ₹2-3L income | ₹15-25L Year 1 |
| Project ends | Business grows |
| No asset | Sellable product |
| Trade time for money | Passive income potential |

### The Smart Path

1. **Don't take the ₹2-3L client project** (or take it but convert them to your first subscriber)
2. **Invest 8 months** building the complete SaaS
3. **Launch at ₹1,500-3,000/month** (affordable for small builders)
4. **Target 100 customers in Year 1** = ₹25L+ revenue
5. **By Year 3**, you own a ₹1 Cr+ ARR business

---

*This is your path from freelancer to SaaS founder.*

*Generated: January 30, 2026*
