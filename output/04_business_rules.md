# Business Rules — ElanjaiBuildos

| ID | Rule | Type | Source |
|----|------|------|--------|
| BR-001 | Email unique per tenant schema (not global) | Validation | D-029 |
| BR-002 | Slug: 3–30 lowercase alnum+hyphen; reserved blocklist; immutable | Validation | D-019/033 |
| BR-003 | Login allowed only when tenant in TRIAL/ACTIVE/GRACE | Authorization | D-013 |
| BR-004 | Trial = 14 days from provisioning | Temporal | D-012 |
| BR-005 | Payment fail/expiry → GRACE 7d → SUSPENDED; cancel → end-of-period → OFFBOARDING → delete +30d | Workflow | D-013/017 |
| BR-006 | Construction stage percentages total exactly 100 | Validation | existing |
| BR-007 | Quotation status flow one-way: Draft→Finalized→Sent→Signed→Converted | Workflow | existing |
| BR-008 | Attendance cannot be marked for future dates | Validation | existing |
| BR-009 | Upgrade prorated immediate; downgrade at renewal; over-quota downgrade keeps data, blocks new creates | Workflow | D-034/062 |
| BR-010 | Hard block at limits: 403 PLAN_LIMIT + upgrade CTA | Authorization | D-014 |
| BR-011 | Razorpay webhooks: signature verify + idempotency by event id | Security | D-004 |
| BR-012 | GST: CGST+SGST intra-state, IGST inter-state (platform state vs tenant state) | Calculation | D-027 |
| BR-013 | Invoice numbering INV-YYYY-NNNNN sequential per FY | Validation | D-027 |
| BR-014 | Only staff roles count toward user limit; clients exempt | Calculation | D-015 |
| BR-015 | Platform users in public schema; tenant users in t_<slug> | Authorization | D-006 |
| BR-016 | No cross-tenant reads; schema resolved only from verified context (JWT tenant_id cross-checked vs Host) | Authorization | D-003 |
| BR-017 | Client portal read-only + change-request submit | Authorization | existing |
| BR-018 | Invite links: 72h expiry, single-use | Temporal | D-029 |
| BR-019 | Password ≥ 8 chars; lockout after 5 fails | Validation | NFR |
| BR-020 | JWT scoped: token valid only against its tenant; host mismatch → 403 | Security | D-003 |
| BR-021 | Password-reset links: 1h expiry, single-use | Temporal | D-063 |
| BR-022 | Quotation numbering per tenant: QTN-YYYY-NNNNN sequential | Validation | D-063 |
| BR-023 | Timestamps stored UTC, displayed Asia/Kolkata | Convention | D-063 |
| BR-024 | Duplicate pending signup for same email → rejected "signup already pending"; allowed after rejection | Validation | D-063 |
| BR-025 | Dev seeds a demo tenant with sample data for development/testing | Convention | D-063 |
| BR-026 | Grace period = read-only (login ok, writes blocked); SUSPENDED = no login | Authorization | D-037 |
| BR-027 | Client portal blocked with graceful message during GRACE/SUSPENDED | Authorization | D-038 |
| BR-028 | Expense approval: SiteManager enters → Owner/Admin approves; only approved expenses in reports | Workflow | D-036 |
| BR-029 | Signup email verification link at signup; admin sees verified badge | Validation | D-061 |
| BR-030 | Razorpay = one-time payment per billing cycle; renewal reminders D-7/D-3/D-1 before period end | Workflow | D-051 |
