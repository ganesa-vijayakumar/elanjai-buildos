-- Canonical sign-in username for tenant users: <local>@<slug>.
-- Expand-only (expand/contract policy): additive nullable column, nothing dropped.
ALTER TABLE users ADD COLUMN IF NOT EXISTS username varchar(100) NULL;

-- Unique within the tenant schema. NULL rows (pre-backfill legacy users) are exempt.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint
                   WHERE conname = 'uq_users_username' AND conrelid = 'users'::regclass) THEN
        ALTER TABLE users ADD CONSTRAINT uq_users_username UNIQUE (username);
    END IF;
END $$;
