# Traceability Matrix — ElanjaiBuildos

| Feature | User Stories | Entities | Screens | Business Rules | Priority | Slice |
|---------|-------------|----------|---------|---------------|----------|-------|
| F-001 Signup | US-001 | signup_requests, tenants | SCR-002/003 | BR-002/024/029 | Must | S1 |
| F-002 Slug validation | US-001 | tenants, platform_settings | SCR-002 | BR-002 | Must | S1 |
| F-003 Approval queue | US-002 | signup_requests, platform_audit_log | SCR-013 | — | Must | S1 |
| F-004 Provisioning | US-002 | tenants, usage_counters | — | BR-004 | Must | S1 |
| F-005 Welcome + wizard | — | tenant_settings, files | SCR-036 | — | Must | S1 |
| F-006 Lifecycle engine | US-003 | tenants, tenant_notifications | SCR-009 | BR-003/005/026/027 | Must | S1 |
| F-010 Plan catalog | — | plans | SCR-014 | — | Must | S1 |
| F-011 Razorpay checkout | US-004/010 | subscriptions, invoices | SCR-034 | BR-009/030 | Must | S1 |
| F-012 Trial | US-003 | tenants, tenant_notifications | SCR-009 | BR-004/005 | Must | S1 |
| F-013 Webhooks | US-004 | subscriptions, invoices, platform_audit_log | — | BR-011 | Must | S1 |
| F-014 GST invoices | US-005 | invoices, platform_settings | SCR-034/015 | BR-012/013 | Must | S1 |
| F-015 Plan change | US-010 | subscriptions | SCR-034 | BR-009 | Should | S1 |
| F-016 Offboard/export | US-008 | tenants, files, platform_audit_log | — | BR-005 | Must | S1 |
| F-017 Dunning | US-004 | tenants, tenant_notifications | SCR-009 | BR-005/030 | Must | S1 |
| F-020 Feature flags | US-006 | plans.feature_flags | — | BR-010 | Must | S1 |
| F-021 Usage limits | US-006 | usage_counters | SCR-034 | BR-010/014 | Must | S1 |
| F-022 Metering | US-007 | usage_counters | SCR-010/012 | — | Must | S1 |
| F-030 Platform login | — | platform_users | SCR-005 | BR-015/019 | Must | S1 |
| F-031 Tenant list/detail | US-007 | tenants, usage_counters | SCR-011/012 | — | Must | S1 |
| F-032 Approvals UI | US-002 | signup_requests | SCR-013 | — | Must | S1 |
| F-033 Plan mgmt UI | — | plans | SCR-014 | — | Should | S1 |
| F-034 Subscriptions/MRR | US-007 | subscriptions, invoices | SCR-010/015 | — | Must | S1 |
| F-035 Suspend/offboard | — | tenants, platform_audit_log | SCR-012 | BR-005 | Must | S1 |
| F-036 Platform settings | — | platform_settings | SCR-016 | — | Should | S1 |
| F-037 Support views | US-007 | — | SCR-010..017 | BR-015 | Should | S1 |
| F-040 Tenant auth/invites | US-009 | users, invites | SCR-004/008/006 | BR-001/015/018/019/020/021 | Must | S2 |
| F-041 Dashboards | — | activity_logs, budget_alerts | SCR-020 | — | Must | S2 |
| F-042 Quotation engine | — | quotations + detail tables | SCR-024 | BR-007/022 | Must | S2 |
| F-043 Agreement | — | quotations, tenant_settings | SCR-025 | — | Must | S2 |
| F-044 Project wizard | — | sites, site_stages | SCR-026 | BR-006 | Must | S2 |
| F-045 Site tracking | — | sites, expenses, collections, budget_alerts | SCR-023 | BR-028 | Must | S2 |
| F-046 Labor | — | workers, attendance, advances, payment_summaries | SCR-028 | BR-008/028 | Must | S3 |
| F-047 Estimator | — | material_calculations | SCR-029 | — | Must | S3 |
| F-048 Material tracking | — | project_materials, materials, brands | SCR-030 | — | Must | S3 |
| F-049 Reports + CSV | — | all tenant | SCR-031 | — | Must | S3 |
| F-050 Settings masters | — | packages, materials, brands, stage_templates, extra_works, tenant_settings | SCR-032 | — | Must | S2 |
| F-051 Client portal | — | sites, collections, photos, change_requests | SCR-022 | BR-017/027 | Must | S3 |
| F-052 Photos | — | site_photos, files | SCR-023 | — | Must | S3 |
| F-053 Notifications | — | notifications | SCR-037 | — | Should | S3 |
| F-054 Branding | — | tenant_settings, files | SCR-035 | — | Should | S3 |
| F-055 Tenant billing | US-010 | subscriptions, invoices, usage_counters | SCR-034 | BR-009/010 | Must | S2 |

## Coverage
| Artifact | Total | Mapped |
|----------|-------|--------|
| Features | 35 | 35 (100%) |
| User stories | 10 | 10 (100%) |
| Entities | 36 | 36 (100%) |
| Screens | 37 | 37 (100%) |
| Business rules | 30 | 30 (100%) |
