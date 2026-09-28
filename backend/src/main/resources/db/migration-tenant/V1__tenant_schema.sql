-- ============================================================
-- V1: Tenant schema — applied to each t_<slug> schema
-- Runs with search_path = t_<slug>; all objects unqualified.
-- ============================================================

-- ---------- Identity ----------
CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(190) NOT NULL UNIQUE,        -- unique per tenant schema (BR-001)
    password    VARCHAR(100) NOT NULL,
    full_name   VARCHAR(160) NOT NULL,
    phone       VARCHAR(30),
    role        VARCHAR(20) NOT NULL,                -- OWNER|ADMIN|SITE_MANAGER|CLIENT
    status      VARCHAR(16) NOT NULL DEFAULT 'active',
    created_by  UUID,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS invites (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(190) NOT NULL,
    role        VARCHAR(20) NOT NULL,
    token       VARCHAR(80) NOT NULL UNIQUE,
    site_id     UUID,                                -- client invites linked to site
    expires_at  TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    invited_by  UUID REFERENCES users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS password_resets (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email      VARCHAR(190) NOT NULL,
    token      VARCHAR(80) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,                 -- 1h, single-use (BR-021)
    used_at    TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Masters / settings ----------
CREATE TABLE IF NOT EXISTS packages (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code         VARCHAR(20) NOT NULL,               -- basic|standard|premium|custom
    name         VARCHAR(80) NOT NULL,
    rate_per_sqft NUMERIC(10,2) NOT NULL,
    highlights   JSONB NOT NULL DEFAULT '[]',
    is_default   BOOLEAN NOT NULL DEFAULT FALSE,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS stage_templates (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(120) NOT NULL,
    percentage    NUMERIC(5,2) NOT NULL,
    estimated_days INTEGER,
    order_index   INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS materials (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name         VARCHAR(120) NOT NULL,
    category     VARCHAR(40) NOT NULL,               -- cement|steel|sand|aggregate|bricks|electrical|plumbing|paint|tiles|wood|other
    unit         VARCHAR(20) NOT NULL,               -- bag|kg|ton|cft|nos|ltr|box|sqft
    rate_basic   NUMERIC(12,2),
    rate_standard NUMERIC(12,2),
    rate_premium NUMERIC(12,2),
    is_active    BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS brands (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name      VARCHAR(120) NOT NULL,
    category  VARCHAR(40),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS extra_works (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(160) NOT NULL,
    description     TEXT,
    rate            NUMERIC(12,2),
    unit            VARCHAR(20),
    default_enabled BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS tenant_settings (
    key        VARCHAR(80) PRIMARY KEY,
    value      JSONB,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Legacy KV settings (frontend settings masters) — kept alongside tenant_settings
CREATE TABLE IF NOT EXISTS settings (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "key"      VARCHAR(120) NOT NULL UNIQUE,
    value      TEXT,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS files (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    path         VARCHAR(500) NOT NULL,              -- <schema>/<kind>/<uuid>.<ext>
    content_type VARCHAR(120),
    size_bytes   BIGINT,
    kind         VARCHAR(20) NOT NULL,               -- photo|logo|invoice|export|reference
    uploaded_by  UUID REFERENCES users(id),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Quotations ----------
CREATE TABLE IF NOT EXISTS quotations (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_number VARCHAR(30) NOT NULL UNIQUE,    -- QTN-YYYY-NNNNN
    client_name      VARCHAR(160) NOT NULL,
    client_phone     VARCHAR(30),
    client_email     VARCHAR(190),
    location         VARCHAR(240),
    builtup_area     NUMERIC(12,2),
    rate_per_sqft    NUMERIC(12,2),
    package_name     VARCHAR(20),
    total_value      NUMERIC(14,2),
    stage_breakdown  TEXT,                             -- legacy JSON blob (normalized tables preferred)
    status           VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft|finalized|sent|signed|converted|cancelled
    converted_site_id UUID,
    building_type    VARCHAR(40),
    notes            TEXT,
    cancelled_reason TEXT,
    created_by       UUID REFERENCES users(id),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quotation_stage_lines (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    stage_name   VARCHAR(120) NOT NULL,
    percentage   NUMERIC(5,2) NOT NULL,
    amount       NUMERIC(14,2),
    order_index  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_qsl_quote ON quotation_stage_lines (quotation_id);

CREATE TABLE IF NOT EXISTS quotation_floor_materials (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    floor_label  VARCHAR(60) NOT NULL,
    material_id  UUID REFERENCES materials(id),
    brand_id     UUID REFERENCES brands(id),
    category     VARCHAR(40),
    quantity     NUMERIC(12,2),
    rate         NUMERIC(12,2),
    notes        TEXT
);
CREATE INDEX IF NOT EXISTS idx_qfm_quote ON quotation_floor_materials (quotation_id);

CREATE TABLE IF NOT EXISTS quotation_electrical_rooms (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id   UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    room_key       VARCHAR(60),
    name           VARCHAR(120) NOT NULL,
    lights         INTEGER DEFAULT 0,
    fans           INTEGER DEFAULT 0,
    socket_5a      INTEGER DEFAULT 0,
    socket_15a     INTEGER DEFAULT 0,
    ac_provision   INTEGER DEFAULT 0,
    tv_point       INTEGER DEFAULT 0,
    other          VARCHAR(240),
    switches_brand VARCHAR(120),
    wires_brand    VARCHAR(120)
);
CREATE INDEX IF NOT EXISTS idx_qer_quote ON quotation_electrical_rooms (quotation_id);

CREATE TABLE IF NOT EXISTS quotation_extra_works (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id  UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    extra_work_id UUID REFERENCES extra_works(id),
    name          VARCHAR(160) NOT NULL,
    quantity      NUMERIC(12,2),
    rate          NUMERIC(12,2),
    amount        NUMERIC(14,2)
);
CREATE INDEX IF NOT EXISTS idx_qew_quote ON quotation_extra_works (quotation_id);

-- ---------- Sites / stages ----------
CREATE TABLE IF NOT EXISTS sites (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_name      VARCHAR(160) NOT NULL,
    client_name    VARCHAR(160),
    client_phone   VARCHAR(30),
    client_email   VARCHAR(190),
    client_user_id UUID REFERENCES users(id),         -- one client per project (D-049)
    location       VARCHAR(240),
    builtup_area   NUMERIC(12,2),
    rate_per_sqft  NUMERIC(12,2),
    package_name   VARCHAR(20),
    total_value    NUMERIC(14,2),
    current_stage  VARCHAR(120),
    status         VARCHAR(20) NOT NULL DEFAULT 'active', -- active|on_hold|completed|cancelled
    start_date     DATE,
    expected_end_date DATE,
    estimated_material_expense NUMERIC(14,2),
    blocks         JSONB,                              -- apartment blocks/units config
    quotation_id   UUID REFERENCES quotations(id),
    assigned_to    UUID REFERENCES users(id),          -- site manager
    created_by     UUID REFERENCES users(id),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sites_status ON sites (status);

CREATE TABLE IF NOT EXISTS site_stages (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id       UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    name          VARCHAR(120) NOT NULL,
    percentage    NUMERIC(5,2) NOT NULL,
    budget_amount NUMERIC(14,2),
    actual_spent  NUMERIC(14,2) NOT NULL DEFAULT 0,
    status        VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending|in_progress|completed|delayed
    planned_start DATE, planned_end DATE,
    actual_start  DATE, actual_end DATE,
    order_index   INTEGER NOT NULL,
    notes         TEXT
);
CREATE INDEX IF NOT EXISTS idx_stages_site ON site_stages (site_id);

CREATE TABLE IF NOT EXISTS collections (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id      UUID NOT NULL REFERENCES sites(id),
    stage_id     UUID REFERENCES site_stages(id),
    stage        VARCHAR(120),                        -- legacy enum value; site_stages FK preferred
    amount       NUMERIC(14,2) NOT NULL,
    payment_mode VARCHAR(20) NOT NULL,               -- cash|upi|neft|cheque|card|other
    reference_number VARCHAR(80),
    received_date DATE NOT NULL,
    notes        TEXT,
    created_by   UUID REFERENCES users(id),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_collections_site ON collections (site_id);

CREATE TABLE IF NOT EXISTS expenses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id         UUID NOT NULL REFERENCES sites(id),
    stage_id        UUID REFERENCES site_stages(id),
    category        VARCHAR(20) NOT NULL,            -- labor|material|equipment|transport|other
    item_name       VARCHAR(240) NOT NULL,
    description     TEXT,
    quantity        NUMERIC(12,2),
    unit            VARCHAR(20),
    unit_price      NUMERIC(12,2),
    total_amount    NUMERIC(14,2) NOT NULL,
    paid_to         VARCHAR(160),
    payment_mode    VARCHAR(20),
    bill_image_url  VARCHAR(500),
    expense_date    DATE NOT NULL,
    approval_status VARCHAR(16) NOT NULL DEFAULT 'pending', -- pending|approved|rejected
    approved_by     UUID REFERENCES users(id),
    approved_at     TIMESTAMPTZ,
    rejection_reason TEXT,
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_expenses_site ON expenses (site_id);
CREATE INDEX IF NOT EXISTS idx_expenses_approval ON expenses (approval_status);

CREATE TABLE IF NOT EXISTS material_spent (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id      UUID NOT NULL REFERENCES sites(id),
    material_type VARCHAR(80) NOT NULL,
    quantity     NUMERIC(12,2) NOT NULL,
    unit         VARCHAR(20) NOT NULL,
    updated_by   UUID REFERENCES users(id),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (site_id, material_type)
);
CREATE INDEX IF NOT EXISTS idx_matspent_site ON material_spent (site_id);

-- ---------- Labor ----------
CREATE TABLE IF NOT EXISTS workers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(160) NOT NULL,
    phone           VARCHAR(30),
    type            VARCHAR(30) NOT NULL,            -- mason|helper|bar_bender|carpenter|electrician|plumber|painter|other
    daily_wage      NUMERIC(10,2) NOT NULL,
    project_id      UUID REFERENCES sites(id),
    status          VARCHAR(16) NOT NULL DEFAULT 'active',
    advance_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
    photo_file_id   UUID REFERENCES files(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_workers_site ON workers (project_id);

CREATE TABLE IF NOT EXISTS daily_attendance (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date       DATE NOT NULL,
    project_id UUID NOT NULL REFERENCES sites(id),
    marked_by  UUID REFERENCES users(id),
    marked_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes      TEXT,
    UNIQUE (date, project_id)
);

CREATE TABLE IF NOT EXISTS attendance_records (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attendance_id  UUID NOT NULL REFERENCES daily_attendance(id) ON DELETE CASCADE,
    worker_id      UUID NOT NULL REFERENCES workers(id),
    status         VARCHAR(12) NOT NULL,             -- present|half_day|absent|leave
    wage_earned    NUMERIC(10,2),
    overtime_hours NUMERIC(4,1) DEFAULT 0,
    overtime_pay   NUMERIC(10,2) DEFAULT 0,
    UNIQUE (attendance_id, worker_id)
);
CREATE INDEX IF NOT EXISTS idx_attrec_worker ON attendance_records (worker_id);

CREATE TABLE IF NOT EXISTS worker_advances (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id        UUID NOT NULL REFERENCES workers(id),
    amount           NUMERIC(12,2) NOT NULL,
    date             DATE NOT NULL,
    reason           TEXT,
    recorded_by      UUID REFERENCES users(id),
    status           VARCHAR(20) NOT NULL DEFAULT 'pending_recovery', -- pending_recovery|recovered|waived
    recovered_amount NUMERIC(12,2) DEFAULT 0,
    recovered_at     TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_advances_worker ON worker_advances (worker_id);

CREATE TABLE IF NOT EXISTS payment_summaries (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id  UUID NOT NULL REFERENCES sites(id),
    week_start  DATE NOT NULL,
    week_end    DATE NOT NULL,
    items       JSONB NOT NULL DEFAULT '[]',         -- [{workerId,name,days,gross,advances,net}]
    total_gross NUMERIC(14,2),
    total_advances NUMERIC(14,2),
    total_net   NUMERIC(14,2),
    status      VARCHAR(20) NOT NULL DEFAULT 'pending_approval', -- pending_approval|approved|paid
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    paid_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_paysum_site ON payment_summaries (project_id);

-- ---------- Materials tracking & estimator ----------
CREATE TABLE IF NOT EXISTS material_calculations (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id    UUID REFERENCES sites(id),
    task_type     VARCHAR(40) NOT NULL,              -- concrete|brickwork|plaster|flooring|paint|steel|rcc|foundation
    dimensions    JSONB NOT NULL,
    results       JSONB NOT NULL,
    calculated_by UUID REFERENCES users(id),
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_materials (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES sites(id),
    category        VARCHAR(40),
    material_name   VARCHAR(160) NOT NULL,
    specified_brand VARCHAR(120),
    actual_brand_id UUID REFERENCES brands(id),
    est_quantity    NUMERIC(12,2),
    actual_quantity NUMERIC(12,2),
    unit            VARCHAR(20),
    status          VARCHAR(16) NOT NULL DEFAULT 'pending', -- pending|ordered|delivered|installed
    status_history  JSONB NOT NULL DEFAULT '[]',
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_projmats_site ON project_materials (project_id);

-- ---------- Portal / comms ----------
CREATE TABLE IF NOT EXISTS site_photos (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id     UUID NOT NULL REFERENCES sites(id),
    stage_id    UUID REFERENCES site_stages(id),
    file_id     UUID NOT NULL REFERENCES files(id),
    caption     VARCHAR(240),
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_photos_site ON site_photos (site_id);

CREATE TABLE IF NOT EXISTS change_requests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cr_number       VARCHAR(30) NOT NULL UNIQUE,     -- CR-YYYY-NNNNN
    project_id      UUID NOT NULL REFERENCES sites(id),
    description     TEXT NOT NULL,
    type            VARCHAR(30),                     -- design|material|scope
    category        VARCHAR(40),                     -- structural|electrical|plumbing|flooring|paint|other
    cost_impact     NUMERIC(14,2),
    timeline_impact VARCHAR(80),
    status          VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending|approved|rejected|in_progress|completed
    reference_image_id UUID REFERENCES files(id),
    approver_notes  TEXT,
    requested_by    VARCHAR(10) NOT NULL DEFAULT 'client', -- client|builder
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID REFERENCES users(id),            -- NULL = role-targeted/broadcast
    type       VARCHAR(40),
    title      VARCHAR(200) NOT NULL,
    message    TEXT,
    link       VARCHAR(300),
    read_by    JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS activity_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id     UUID REFERENCES sites(id),
    type        VARCHAR(40),
    title       VARCHAR(200) NOT NULL,
    description TEXT,
    user_id     UUID REFERENCES users(id),
    metadata    JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activity_site ON activity_logs (site_id, created_at DESC);

CREATE TABLE IF NOT EXISTS budget_alerts (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id       UUID NOT NULL REFERENCES sites(id),
    stage_id      UUID REFERENCES site_stages(id),
    type          VARCHAR(12) NOT NULL,              -- warning|critical
    threshold     NUMERIC(5,2),
    current_spend NUMERIC(14,2),
    budget        NUMERIC(14,2),
    message       TEXT,
    acknowledged  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
