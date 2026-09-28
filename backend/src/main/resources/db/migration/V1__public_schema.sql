-- ============================================================
-- V1: Public (platform) schema — ElanjaiBuildos multi-tenant
-- ============================================================

CREATE TABLE IF NOT EXISTS plans (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code                     VARCHAR(40) NOT NULL UNIQUE,
    name                     VARCHAR(80) NOT NULL,
    price_monthly_inr        INTEGER NOT NULL,
    price_yearly_inr         INTEGER NOT NULL,
    max_projects             INTEGER NOT NULL,           -- -1 = unlimited
    max_staff_users          INTEGER NOT NULL,
    max_quotations_per_month INTEGER NOT NULL,
    storage_gb               INTEGER NOT NULL,
    feature_flags            JSONB NOT NULL DEFAULT '{}',
    is_active                BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order               INTEGER NOT NULL DEFAULT 0,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenants (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name        VARCHAR(160) NOT NULL,
    slug                VARCHAR(30) NOT NULL UNIQUE,
    schema_name         VARCHAR(40) NOT NULL UNIQUE,      -- t_<slug>
    owner_name          VARCHAR(160) NOT NULL,
    owner_email         VARCHAR(190) NOT NULL,
    phone               VARCHAR(30),
    gstin               VARCHAR(20),
    state               VARCHAR(80),
    status              VARCHAR(24) NOT NULL DEFAULT 'PENDING_APPROVAL',
    plan_id             UUID REFERENCES plans(id),
    billing_cycle       VARCHAR(10) NOT NULL DEFAULT 'monthly',
    trial_ends_at       TIMESTAMPTZ,
    current_period_end  TIMESTAMPTZ,
    approved_by         UUID,
    approved_at         TIMESTAMPTZ,
    reject_reason       TEXT,
    suspended_at        TIMESTAMPTZ,
    cancelled_at        TIMESTAMPTZ,
    offboarded_at       TIMESTAMPTZ,
    deleted_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_slug_format CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$')
);

CREATE TABLE IF NOT EXISTS platform_users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(190) NOT NULL UNIQUE,
    password    VARCHAR(100) NOT NULL,                    -- BCrypt
    name        VARCHAR(160) NOT NULL,
    role        VARCHAR(24) NOT NULL,                     -- PLATFORM_ADMIN | PLATFORM_SUPPORT
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS signup_requests (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name   VARCHAR(160) NOT NULL,
    owner_name     VARCHAR(160) NOT NULL,
    email          VARCHAR(190) NOT NULL,
    phone          VARCHAR(30),
    password_hash  VARCHAR(100) NOT NULL,
    slug           VARCHAR(30) NOT NULL,
    gstin          VARCHAR(20),
    state          VARCHAR(80),
    plan_id        UUID REFERENCES plans(id),
    billing_cycle  VARCHAR(10) NOT NULL DEFAULT 'monthly',
    status         VARCHAR(24) NOT NULL DEFAULT 'PENDING',  -- PENDING|APPROVED|REJECTED|PROVISIONED|PROVISION_FAILED
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verify_token   VARCHAR(80),
    reviewed_by    UUID,
    reviewed_at    TIMESTAMPTZ,
    reject_reason  TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_signup_slug_pending
    ON signup_requests (slug) WHERE status = 'PENDING';
CREATE UNIQUE INDEX IF NOT EXISTS uq_signup_email_pending
    ON signup_requests (email) WHERE status = 'PENDING';
CREATE INDEX IF NOT EXISTS idx_signup_verify_token ON signup_requests (verify_token);

CREATE TABLE IF NOT EXISTS subscriptions (
    id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                 UUID NOT NULL REFERENCES tenants(id),
    plan_id                   UUID NOT NULL REFERENCES plans(id),
    razorpay_subscription_id  VARCHAR(80),
    razorpay_customer_id      VARCHAR(80),
    status                    VARCHAR(24) NOT NULL DEFAULT 'PENDING', -- PENDING|ACTIVE|PAST_DUE|CANCELLED|EXPIRED
    billing_cycle             VARCHAR(10) NOT NULL DEFAULT 'monthly',
    current_period_start      TIMESTAMPTZ,
    current_period_end        TIMESTAMPTZ,
    cancel_at_period_end      BOOLEAN NOT NULL DEFAULT FALSE,
    scheduled_plan_id         UUID REFERENCES plans(id),
    created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant ON subscriptions (tenant_id);

CREATE TABLE IF NOT EXISTS invoices (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number     VARCHAR(30) NOT NULL UNIQUE,      -- INV-YYYY-NNNNN
    tenant_id          UUID NOT NULL REFERENCES tenants(id),
    subscription_id    UUID REFERENCES subscriptions(id),
    razorpay_payment_id VARCHAR(80),
    razorpay_order_id  VARCHAR(80),
    period_start       DATE,
    period_end         DATE,
    description        VARCHAR(240),
    taxable_amount     NUMERIC(12,2) NOT NULL DEFAULT 0,
    cgst               NUMERIC(12,2) NOT NULL DEFAULT 0,
    sgst               NUMERIC(12,2) NOT NULL DEFAULT 0,
    igst               NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_inr          NUMERIC(12,2) NOT NULL DEFAULT 0,
    status             VARCHAR(16) NOT NULL DEFAULT 'draft',  -- draft|issued|paid|voided|refunded
    payment_link_url   TEXT,
    pdf_path           VARCHAR(400),
    issued_at          TIMESTAMPTZ,
    paid_at            TIMESTAMPTZ,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices (tenant_id);

CREATE TABLE IF NOT EXISTS usage_counters (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id  UUID NOT NULL REFERENCES tenants(id),
    metric     VARCHAR(32) NOT NULL,                      -- staff_users|projects|quotations_month|storage_mb|api_calls_day
    period_key VARCHAR(10) NOT NULL DEFAULT '',           -- 'YYYY-MM' for monthly metrics, '' for cumulative
    value      BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, metric, period_key)
);

CREATE TABLE IF NOT EXISTS platform_audit_log (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id    UUID,
    actor_role  VARCHAR(24),
    action      VARCHAR(80) NOT NULL,
    entity_type VARCHAR(60),
    entity_id   VARCHAR(80),
    details     JSONB,
    ip          VARCHAR(60),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON platform_audit_log (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_time ON platform_audit_log (created_at DESC);

CREATE TABLE IF NOT EXISTS platform_settings (
    key        VARCHAR(80) PRIMARY KEY,
    value      TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenant_notifications (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id  UUID REFERENCES tenants(id),
    channel    VARCHAR(10) NOT NULL,                      -- email | inapp
    type       VARCHAR(40) NOT NULL,                      -- approved|rejected|trial_ending|payment_failed|suspended|cancelled|export_ready|invite|welcome|verify
    recipient  VARCHAR(190),
    payload    JSONB,
    status     VARCHAR(16) NOT NULL DEFAULT 'pending',    -- pending|sent|failed
    sent_at    TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notif_status ON tenant_notifications (status) WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS processed_webhook_events (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id    VARCHAR(120) NOT NULL UNIQUE,             -- Razorpay event id (idempotency key)
    event_type  VARCHAR(80),
    processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Seed: plan catalog (D-023 business plan pricing)
-- ============================================================
INSERT INTO plans (code, name, price_monthly_inr, price_yearly_inr, max_projects, max_staff_users, max_quotations_per_month, storage_gb, feature_flags, sort_order) VALUES
 ('starter',      'Starter',      1499, 14990,  5,  2,  10,   2,  '{}'::jsonb, 1),
 ('professional', 'Professional', 2999, 29990, 20,  5,  50,  10,  '{"client_portal":true,"labor_tracking":true}'::jsonb, 2),
 ('business',     'Business',     4999, 49990, 50, 15, 200,  50,  '{"client_portal":true,"labor_tracking":true,"advanced_reports":true}'::jsonb, 3),
 ('enterprise',   'Enterprise',   9999, 99990, -1, -1,  -1, 200,  '{"client_portal":true,"labor_tracking":true,"advanced_reports":true,"white_label":true}'::jsonb, 4)
ON CONFLICT (code) DO NOTHING;

-- Platform settings defaults
INSERT INTO platform_settings (key, value) VALUES
 ('platform.gstin', '33AABCE0000A1Z5'),
 ('platform.state', 'Tamil Nadu'),
 ('platform.name', 'Elanjai Technologies'),
 ('platform.sac_code', '998314'),
 ('invoice.sequence.2026', '0'),
 ('reserved_slugs', 'www,app,api,admin,mail,smtp,ftp,localhost,support,help,blog,docs,status,billing,dashboard,platform,root,system')
ON CONFLICT (key) DO NOTHING;

-- Platform admin is seeded by DataInitializer (password via PLATFORM_ADMIN_PASSWORD env).
-- No credentials are stored in migrations.
