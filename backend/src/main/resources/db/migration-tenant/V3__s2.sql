-- S2: approvals on collections + setup wizard support + notifications hardening

-- Collections: approval workflow (existing rows grandfathered as approved)
ALTER TABLE collections
    ADD COLUMN IF NOT EXISTS approval_status varchar(16) NOT NULL DEFAULT 'approved',
    ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS approved_at timestamptz,
    ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Stage templates: tenant-editable; seeded rows marked so deletes don't resurrect
ALTER TABLE stage_templates
    ADD COLUMN IF NOT EXISTS is_default boolean NOT NULL DEFAULT true;

-- Notifications: ensure index for per-user feeds
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);

-- Site stages: quick lookup
CREATE INDEX IF NOT EXISTS idx_site_stages_site ON site_stages(site_id, order_index);
