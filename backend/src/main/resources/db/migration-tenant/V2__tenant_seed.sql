-- ============================================================
-- V2: Tenant seed — default masters per provisioned tenant
-- Stage template (sums to 100%), packages, starter materials/brands
-- ============================================================

-- Default construction stage template (total = 100.00)
INSERT INTO stage_templates (name, percentage, estimated_days, order_index) VALUES
 ('Site preparation & marking',      3.00,  3,  1),
 ('Foundation & footing',           12.00, 15,  2),
 ('Plinth beam & backfilling',       5.00,  7,  3),
 ('Column & frame structure',       10.00, 20,  4),
 ('Roof slab (each floor)',         12.00, 21,  5),
 ('Brick masonry',                  10.00, 18,  6),
 ('Plastering (internal+external)',  8.00, 14,  7),
 ('Electrical & plumbing rough-in',  8.00, 12,  8),
 ('Flooring & tiling',               8.00, 15,  9),
 ('Doors, windows & joinery',        5.00, 10, 10),
 ('Painting & finishing',            8.00, 14, 11),
 ('Fixtures, handover & cleanup',    11.00, 20, 12)
ON CONFLICT DO NOTHING;

-- Default packages
INSERT INTO packages (code, name, rate_per_sqft, highlights, is_default) VALUES
 ('basic',    'Basic',    1850.00, '["Standard materials","Essential electrical provisions","Vitrified flooring"]'::jsonb, false),
 ('standard', 'Standard', 2150.00, '["Branded fittings","More electrical provisions","Premium tiles","Modular kitchen provision"]'::jsonb, true),
 ('premium',  'Premium',  2650.00, '["Premium brands throughout","Full smart provisions","Designer finishes","Dedicated supervisor"]'::jsonb, false)
ON CONFLICT DO NOTHING;

-- Starter material masters
INSERT INTO materials (name, category, unit, rate_basic, rate_standard, rate_premium) VALUES
 ('Cement (OPC 53)',        'cement',     'bag',  380,  420,  460),
 ('TMT Steel Fe500',        'steel',      'kg',    62,   68,   75),
 ('M-Sand',                 'sand',       'cft',   55,   65,   75),
 ('Aggregate 20mm',         'aggregate',  'cft',   45,   52,   60),
 ('Red bricks',             'bricks',     'nos',    9,   11,   14),
 ('AAC blocks',             'bricks',     'nos',   42,   48,   55),
 ('PVC pipes (plumbing)',   'plumbing',   'nos',  180,  240,  320),
 ('Copper wire 1.5sqmm',    'electrical', 'box', 1450, 1900, 2400),
 ('Vitrified tiles 2x2',    'tiles',      'sqft',  38,   55,   85),
 ('Emulsion paint',         'paint',      'ltr',  220,  320,  480),
 ('Teak wood (frame)',      'wood',       'cft', 2200, 3200, 4500),
 ('Bathroom fittings set',  'other',      'nos', 8500, 15000, 28000)
ON CONFLICT DO NOTHING;

-- Starter brands
INSERT INTO brands (name, category) VALUES
 ('UltraTech', 'cement'), ('ACC', 'cement'), ('JSW', 'steel'), ('TATA Tiscon', 'steel'),
 ('Finolex', 'electrical'), ('Havells', 'electrical'), ('Polycab', 'electrical'),
 ('Kajaria', 'tiles'), ('Somany', 'tiles'), ('Asian Paints', 'paint'), ('Berger', 'paint'),
 ('Jaquar', 'other'), ('Hindware', 'other'), ('Astral', 'plumbing')
ON CONFLICT DO NOTHING;

-- Default extra works catalog
INSERT INTO extra_works (name, description, rate, unit, default_enabled) VALUES
 ('Compound wall',        'Per running foot',            1450, 'rft',  false),
 ('Sump construction',    'Per 1000L capacity',          9000, 'nos',  false),
 ('Overhead tank',        'Per 1000L capacity',         12000, 'nos',  false),
 ('Septic tank',          'Standard 2-chamber',         45000, 'nos',  false),
 ('Borewell',             'Per foot drilling + casing',   280, 'ft',   false),
 ('Modular kitchen',      'Basic modular setup',       120000, 'nos',  false),
 ('Solar provision',      'Conduit + mounting base',    25000, 'nos',  false),
 ('Rainwater harvesting', 'Pit + piping',               35000, 'nos',  false)
ON CONFLICT DO NOTHING;

-- Default tenant settings
INSERT INTO tenant_settings (key, value) VALUES
 ('company',   '{"name":"","address":"","phone":"","email":"","state":"Tamil Nadu"}'::jsonb),
 ('branding',  '{"accentColor":null,"logoFileId":null}'::jsonb),
 ('agreement', '{"letterhead":true,"termsVersion":"v1"}'::jsonb),
 ('counters',  '{"quotation":0,"changeRequest":0}'::jsonb)
ON CONFLICT (key) DO NOTHING;
