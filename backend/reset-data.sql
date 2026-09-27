-- ============================================================
-- Elanjai Buildos - Database Reset Script
-- Resets ALL data EXCEPT demo user accounts
-- Database: elanjai_dev (MySQL)
-- ============================================================

USE elanjai_dev;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Delete material_spent (references sites)
TRUNCATE TABLE material_spent;

-- 2. Delete collections (references sites, users)
TRUNCATE TABLE collections;

-- 3. Delete expenses (references sites, users)
TRUNCATE TABLE expenses;

-- 4. Delete quotations (references sites, users)
TRUNCATE TABLE quotations;

-- 5. Delete settings (references users)
TRUNCATE TABLE settings;

-- 6. Delete sites (references users)
TRUNCATE TABLE sites;

-- 7. Delete non-demo users (keep the 4 demo accounts)
DELETE FROM users
WHERE email NOT IN (
    'admin@demo.com',
    'owner@demo.com',
    'manager@demo.com',
    'client@demo.com'
);

SET FOREIGN_KEY_CHECKS = 1;

-- Verification
SELECT CONCAT('Remaining users: ', COUNT(*)) AS result FROM users
UNION ALL
SELECT CONCAT('Sites: ', COUNT(*)) FROM sites
UNION ALL
SELECT CONCAT('Collections: ', COUNT(*)) FROM collections
UNION ALL
SELECT CONCAT('Expenses: ', COUNT(*)) FROM expenses
UNION ALL
SELECT CONCAT('Quotations: ', COUNT(*)) FROM quotations
UNION ALL
SELECT CONCAT('Settings: ', COUNT(*)) FROM settings
UNION ALL
SELECT CONCAT('Material Spent: ', COUNT(*)) FROM material_spent;

SELECT '✓ Database reset complete. Demo users preserved.' AS status;
