-- User insertion is handled by DataInitializer.java on startup to ensure proper password hashing.

-- Seed Default Settings
INSERT INTO settings (id, `key`, value, updated_at)
VALUES (
    UNHEX(REPLACE(UUID(), '-', '')),
    'company_profile',
    '{"name": "Elanjai Buildos", "address": "123 Main St, City", "phone": "+91 98765 43210", "email": "contact@elanjaibuildos.com", "gstin": "33ABCDE1234F1Z5"}',
    NOW()
) ON DUPLICATE KEY UPDATE value=VALUES(value);

INSERT INTO settings (id, `key`, value, updated_at)
VALUES (
    UNHEX(REPLACE(UUID(), '-', '')),
    'package_rates',
    '{"ECONOMY": 1800, "STANDARD": 2200, "PREMIUM": 2600, "LUXURY": 3200}',
    NOW()
) ON DUPLICATE KEY UPDATE value=VALUES(value);
