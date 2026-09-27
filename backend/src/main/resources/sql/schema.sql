-- Drop tables if they exist (Order matters due to foreign keys)
DROP TABLE IF EXISTS material_spent;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS expenses;
DROP TABLE IF EXISTS collections;
DROP TABLE IF EXISTS quotations;
DROP TABLE IF EXISTS sites;
DROP TABLE IF EXISTS users;

-- Create Users Table
CREATE TABLE users (
    id BINARY(16) NOT NULL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL, -- OWNER, SITE_MANAGER, CLIENT, ADMIN
    company_name VARCHAR(255),
    company_logo VARCHAR(255)
);

-- Create Sites Table
CREATE TABLE sites (
    id BINARY(16) NOT NULL PRIMARY KEY,
    site_name VARCHAR(255) NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    client_phone VARCHAR(20),
    client_email VARCHAR(255),
    client_user_id BINARY(16),
    location VARCHAR(255),
    builtup_area DECIMAL(10, 2),
    rate_per_sqft DECIMAL(10, 2),
    package_name VARCHAR(50), -- ECONOMY, STANDARD, PREMIUM, LUXURY
    total_value DECIMAL(15, 2),
    current_stage VARCHAR(50),
    status VARCHAR(20), -- ACTIVE, COMPLETED, HOLD, CANCELLED
    start_date DATE,
    expected_end_date DATE,
    estimated_material_expense DECIMAL(15, 2),
    created_by BINARY(16),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_site_client_user FOREIGN KEY (client_user_id) REFERENCES users(id),
    CONSTRAINT fk_site_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Create Collections Table
CREATE TABLE collections (
    id BINARY(16) NOT NULL PRIMARY KEY,
    site_id BINARY(16) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    stage VARCHAR(50),
    payment_mode VARCHAR(20), -- CASH, UPI, CHEQUE, BANK_TRANSFER
    reference_number VARCHAR(100),
    notes TEXT,
    received_date DATE,
    created_by BINARY(16),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_collection_site FOREIGN KEY (site_id) REFERENCES sites(id),
    CONSTRAINT fk_collection_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Create Expenses Table
CREATE TABLE expenses (
    id BINARY(16) NOT NULL PRIMARY KEY,
    site_id BINARY(16) NOT NULL,
    category VARCHAR(50), -- MATERIALS, LABOR, TRANSPORT, PETTY_CASH, CONTRACTOR
    item_name VARCHAR(255),
    quantity DECIMAL(10, 2),
    unit VARCHAR(20),
    unit_price DECIMAL(10, 2),
    total_amount DECIMAL(15, 2) NOT NULL,
    paid_to VARCHAR(255),
    payment_mode VARCHAR(20),
    bill_image_url VARCHAR(255),
    expense_date DATE,
    approval_status VARCHAR(20), -- PENDING, APPROVED, REJECTED
    approved_by BINARY(16),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    created_by BINARY(16),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_expense_site FOREIGN KEY (site_id) REFERENCES sites(id),
    CONSTRAINT fk_expense_approved_by FOREIGN KEY (approved_by) REFERENCES users(id),
    CONSTRAINT fk_expense_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Create Quotations Table
CREATE TABLE quotations (
    id BINARY(16) NOT NULL PRIMARY KEY,
    quotation_number VARCHAR(50) NOT NULL UNIQUE,
    client_name VARCHAR(255) NOT NULL,
    client_phone VARCHAR(20),
    client_email VARCHAR(255),
    location VARCHAR(255),
    builtup_area DECIMAL(10, 2),
    rate_per_sqft DECIMAL(10, 2),
    package_name VARCHAR(50),
    total_value DECIMAL(15, 2),
    stage_breakdown JSON,
    status VARCHAR(20), -- DRAFT, SENT, SIGNED, CONVERTED
    converted_site_id BINARY(16),
    created_by BINARY(16),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_quotation_converted_site FOREIGN KEY (converted_site_id) REFERENCES sites(id),
    CONSTRAINT fk_quotation_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Create Material Spent Table
CREATE TABLE material_spent (
    id BINARY(16) NOT NULL PRIMARY KEY,
    site_id BINARY(16) NOT NULL,
    material_type VARCHAR(50),
    quantity DECIMAL(10, 2),
    unit VARCHAR(20),
    updated_by BINARY(16),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_material_site FOREIGN KEY (site_id) REFERENCES sites(id),
    CONSTRAINT fk_material_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Create Settings Table
CREATE TABLE settings (
    id BINARY(16) NOT NULL PRIMARY KEY,
    `key` VARCHAR(100) NOT NULL UNIQUE,
    value TEXT,
    updated_by BINARY(16),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_setting_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);
