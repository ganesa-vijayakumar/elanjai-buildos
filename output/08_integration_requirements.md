# Integration Requirements — ElanjaiBuildos

## Integration Inventory

| Service | Type | Purpose | Details |
|---------|------|---------|---------|
| Razorpay | payment | Per-cycle billing | Orders/Payment Links — one-time payment per billing cycle (D-051, no mandates). Events: `payment.captured/failed`, `order.paid`, `subscription.*`. Webhooks: signature-verified, idempotent by event id (BR-011). Test keys available (D-021). |
| SMTP | email | Transactional mail | Spring Mail. Templates: welcome, approved/rejected, verify-email, trial D-3/D-1, payment failed, invoice issued, renewal D-7/D-3/D-1, export ready, staff/client invites, password reset. Dev capture: Mailpit (D-057). |
| Local volume | storage | Files | Tenant-keyed storage for photos, logos, invoice PDFs, export ZIPs. `files` table holds metadata. S3-compatible adapter seam for later (D-048). |
| OpenHTMLtoPDF | pdf | Invoice PDFs | Server-side GST invoice PDF generation (D-053). Quotation/agreement remain browser-print. |
| DNS / wildcard | infra | Tenant routing | `*.domain` in prod; `*.localhost` natively in dev + `X-Tenant-ID` header / `?tenant=` fallback (D-055). |

## Deferred Integrations
WhatsApp (D-052) · Tally · SMS OTP · maps (D-054) · S3 (adapter only) · custom-domain SSL.

## Failure Handling
- Webhook delivery retry by Razorpay → idempotent handlers; reconciliation endpoint/job for missed events
- SMTP failure → notification row stays `pending` with retry
- PDF generation failure → invoice row retains `draft`/`issued` without pdf_path; regenerate action
- File upload failure → quota + type checks before write; partial writes cleaned
