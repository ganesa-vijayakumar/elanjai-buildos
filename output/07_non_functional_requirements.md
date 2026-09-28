# Non-Functional Requirements — ElanjaiBuildos

| ID | Category | Requirement | Target |
|----|----------|-------------|--------|
| NFR-001 | capacity | Concurrent users | 50–500 |
| NFR-002 | latency | Page load | < 1.5s |
| NFR-003 | latency | API latency p95 | reads < 500ms; writes < 1s |
| NFR-004 | capacity | Data volume per tenant | 10K–1M rows; FK indexes |
| NFR-005 | security | Password ≥8, lockout after 5 fails, BCrypt, JWT 24h | — |
| NFR-006 | security | Schema-level tenant isolation; zero cross-tenant reads; isolation tests mandatory | 100% |
| NFR-007 | security | HTTPS, parameterized JPA, secrets via env; card data only at Razorpay | — |
| NFR-008 | availability | Uptime target; daily pg_dump all schemas; offsite copy | 99% / RPO 24h |
| NFR-009 | accessibility | Semantic HTML, keyboard nav | best-effort |
| NFR-010 | usability | Responsive; mobile-first site-manager; English, INR, IST | — |
| NFR-011 | other | Tenant provisioning time | < 60s |
| NFR-012 | compliance | DPDP (client PII minimization); GST invoicing; PCI via Razorpay | — |
| NFR-013 | other | Retention: tenant data offboard+30d; audit logs 1yr; backups 30d | — |
| NFR-014 | scalability | Vertical first; stateless → horizontal-ready | — |

## SLOs & Evidence
- p95 login < 500ms · provisioning < 60s · signup→approval < 24h (ops) — evidenced by smoke tests + logs
- Tenant isolation: dedicated cross-tenant isolation test suite is a release gate

## Compliance Matrix
| Obligation | Handling |
|-----------|----------|
| DPDP Act 2023 | Client PII (name/phone/address) minimized; retention bounds; export/delete support |
| GST | Platform GSTIN on invoices; SAC/HSN; CGST+SGST or IGST by state |
| PCI-DSS | Out of scope — Razorpay hosts payment capture; no card data stored |
