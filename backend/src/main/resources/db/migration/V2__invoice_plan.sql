-- Link invoice to the plan purchased (D-051: upgrades apply immediately on payment)
ALTER TABLE invoices
    ADD COLUMN IF NOT EXISTS plan_id uuid REFERENCES plans(id);
