-- Normalize approval_status values/defaults to the ExpenseApprovalStatus enum (uppercase)

UPDATE expenses SET approval_status = upper(approval_status) WHERE approval_status <> upper(approval_status);
UPDATE collections SET approval_status = upper(approval_status) WHERE approval_status <> upper(approval_status);

ALTER TABLE expenses ALTER COLUMN approval_status SET DEFAULT 'PENDING';
ALTER TABLE collections ALTER COLUMN approval_status SET DEFAULT 'PENDING';
