-- ==============================================================================
-- FinSentinel AI Database Migration V1: Schema & pgvector Setup
-- ==============================================================================

-- 1. Enable Vector Extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Users and Roles
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(50) NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

-- 3. Double-Entry Chart of Accounts
CREATE TABLE accounts (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    account_type VARCHAR(30) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    balance NUMERIC(19, 4) NOT NULL DEFAULT 0.0000,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_account_type CHECK (account_type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'))
);

CREATE INDEX idx_accounts_code ON accounts(code);
CREATE INDEX idx_accounts_type ON accounts(account_type);

-- 4. Journal Entries (General Ledger Header)
CREATE TABLE journal_entries (
    id BIGSERIAL PRIMARY KEY,
    entry_number VARCHAR(100) UNIQUE NOT NULL,
    reference_id VARCHAR(100),
    posting_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'POSTED',
    memo TEXT,
    total_amount NUMERIC(19, 4) NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_journal_status CHECK (status IN ('DRAFT', 'POSTED', 'REVERSED'))
);

CREATE INDEX idx_journal_entries_number ON journal_entries(entry_number);
CREATE INDEX idx_journal_entries_date ON journal_entries(posting_date);
CREATE INDEX idx_journal_entries_reference ON journal_entries(reference_id);

-- 5. Journal Lines (Debits and Credits)
CREATE TABLE journal_lines (
    id BIGSERIAL PRIMARY KEY,
    entry_id BIGINT NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id BIGINT NOT NULL REFERENCES accounts(id),
    entry_type VARCHAR(20) NOT NULL,
    amount NUMERIC(19, 4) NOT NULL,
    line_order INT NOT NULL DEFAULT 0,
    memo VARCHAR(255),
    CONSTRAINT chk_entry_type CHECK (entry_type IN ('DEBIT', 'CREDIT')),
    CONSTRAINT chk_positive_amount CHECK (amount > 0)
);

CREATE INDEX idx_journal_lines_entry ON journal_lines(entry_id);
CREATE INDEX idx_journal_lines_account ON journal_lines(account_id);

-- 6. Idempotency Keys Tracker
CREATE TABLE idempotency_keys (
    idempotency_key VARCHAR(128) PRIMARY KEY,
    status VARCHAR(30) NOT NULL,
    response_payload TEXT,
    response_status INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT chk_idempotency_status CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'FAILED'))
);

CREATE INDEX idx_idempotency_expires ON idempotency_keys(expires_at);

-- 7. Immutable Audit Logs
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_entity VARCHAR(100) NOT NULL,
    target_id VARCHAR(100),
    before_state JSONB,
    after_state JSONB,
    ip_address VARCHAR(45),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_target ON audit_logs(target_entity, target_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);

-- 8. Vendors
CREATE TABLE vendors (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    gstin VARCHAR(50) UNIQUE NOT NULL,
    tax_id VARCHAR(50),
    risk_tier VARCHAR(30) NOT NULL DEFAULT 'LOW',
    total_invoiced NUMERIC(19, 4) NOT NULL DEFAULT 0.0000,
    historical_avg_unit_price NUMERIC(19, 4) NOT NULL DEFAULT 0.0000,
    is_verified BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_vendor_risk CHECK (risk_tier IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'))
);

CREATE INDEX idx_vendors_gstin ON vendors(gstin);

-- 9. Invoices
CREATE TABLE invoices (
    id BIGSERIAL PRIMARY KEY,
    vendor_id BIGINT NOT NULL REFERENCES vendors(id),
    invoice_number VARCHAR(100) NOT NULL,
    invoice_date DATE NOT NULL,
    gstin VARCHAR(50) NOT NULL,
    subtotal NUMERIC(19, 4) NOT NULL,
    cgst NUMERIC(19, 4) NOT NULL DEFAULT 0.0000,
    sgst NUMERIC(19, 4) NOT NULL DEFAULT 0.0000,
    igst NUMERIC(19, 4) NOT NULL DEFAULT 0.0000,
    total_amount NUMERIC(19, 4) NOT NULL,
    line_items JSONB NOT NULL,
    fraud_risk_score INT NOT NULL DEFAULT 0,
    triage_status VARCHAR(30) NOT NULL,
    anomaly_reasons JSONB,
    journal_entry_id BIGINT REFERENCES journal_entries(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_vendor_invoice UNIQUE(vendor_id, invoice_number),
    CONSTRAINT chk_triage_status CHECK (triage_status IN ('AUTO_APPROVED', 'FLAGGED_FOR_AUDIT', 'CRITICAL_ANOMALY'))
);

CREATE INDEX idx_invoices_vendor ON invoices(vendor_id);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_triage ON invoices(triage_status);
CREATE INDEX idx_invoices_risk ON invoices(fraud_risk_score);

-- 10. Procurement Policies (RAG Source)
CREATE TABLE procurement_policies (
    id BIGSERIAL PRIMARY KEY,
    policy_code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    threshold_pct NUMERIC(5, 2) NOT NULL DEFAULT 15.00,
    embedding vector(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 11. Spring AI Vector Store Table
CREATE TABLE IF NOT EXISTS vector_store (
    id VARCHAR(36) PRIMARY KEY,
    content TEXT NOT NULL,
    metadata JSONB,
    embedding vector(1536)
);

CREATE INDEX IF NOT EXISTS idx_vector_store_embedding ON vector_store USING hnsw (embedding vector_cosine_ops);

-- ==============================================================================
-- INITIAL SEED DATA
-- ==============================================================================

-- Initial Users (Password: Admin@123 for all seeded accounts, hashed with BCrypt)
-- Hash: $2b$12$QW7ZuOEYlt4mPqHRh8xB6.Ynq7t7IaLno7smgEMHpJ9HgQ1GOVcn6
INSERT INTO users (username, password_hash, email, full_name, role) VALUES
('cfo_admin', '$2b$12$QW7ZuOEYlt4mPqHRh8xB6.Ynq7t7IaLno7smgEMHpJ9HgQ1GOVcn6', 'cfo@finsentinel.ai', 'Alexandra Chen, CFO', 'ROLE_CFO_ADMIN'),
('finance_auditor', '$2b$12$QW7ZuOEYlt4mPqHRh8xB6.Ynq7t7IaLno7smgEMHpJ9HgQ1GOVcn6', 'auditor@finsentinel.ai', 'Marcus Vance, Lead Auditor', 'ROLE_FINANCE_AUDITOR'),
('procurement_mgr', '$2b$12$QW7ZuOEYlt4mPqHRh8xB6.Ynq7t7IaLno7smgEMHpJ9HgQ1GOVcn6', 'procurement@finsentinel.ai', 'Elena Rostova, Procurement Head', 'ROLE_PROCUREMENT_MANAGER'),
('vendor_cloudcorp', '$2b$12$QW7ZuOEYlt4mPqHRh8xB6.Ynq7t7IaLno7smgEMHpJ9HgQ1GOVcn6', 'vendor@cloudscale.io', 'David Miller, Vendor Rep', 'ROLE_VENDOR');

-- Initial Chart of Accounts
INSERT INTO accounts (code, name, account_type, currency, balance, description) VALUES
('1010', 'Cash and Cash Equivalents', 'ASSET', 'USD', 1250000.0000, 'Primary corporate treasury checking and reserve account'),
('1020', 'Accounts Receivable', 'ASSET', 'USD', 450000.0000, 'Pending customer payments and unsettled trade invoices'),
('2010', 'Accounts Payable', 'LIABILITY', 'USD', 180000.0000, 'Approved short-term vendor obligations awaiting settlement'),
('3010', 'Retained Earnings', 'EQUITY', 'USD', 1520000.0000, 'Cumulative net earnings retained for corporate reinvestment'),
('4010', 'Enterprise SaaS Revenue', 'REVENUE', 'USD', 680000.0000, 'Recurring enterprise software contract billings'),
('5010', 'Procurement & Vendor Expenses', 'EXPENSE', 'USD', 115000.0000, 'General corporate procurement and hardware supplier outlays'),
('5020', 'Cloud & AI Infrastructure Expense', 'EXPENSE', 'USD', 245000.0000, 'Compute instances, vector clusters, GPU allocations and CDN fees'),
('5030', 'Statutory Tax & GST Expense', 'EXPENSE', 'USD', 38000.0000, 'Corporate sales tax, GST withholding, and statutory levies');

-- Initial Verified & Flagged Vendors
INSERT INTO vendors (name, gstin, tax_id, risk_tier, total_invoiced, historical_avg_unit_price, is_verified) VALUES
('CloudScale Networks Inc.', '27AABCS1429B1Z8', 'US-EIN-984321', 'LOW', 485000.0000, 1200.0000, TRUE),
('Apex Data Logistics LLC', '29AABCA5678C1Z2', 'US-EIN-456789', 'MEDIUM', 162000.0000, 4500.0000, TRUE),
('Nova Cyberware Solutions', '07AAECN9999P1ZK', 'US-EIN-777123', 'HIGH', 94000.0000, 8000.0000, TRUE),
('Phantom Shell Enterprises', '99INVALIDGSTIN0', 'XX-000-000000', 'CRITICAL', 25000.0000, 500.0000, FALSE);

-- Initial Procurement Policies (For Vector RAG and Compliance Enforcement)
INSERT INTO procurement_policies (policy_code, title, description, threshold_pct) VALUES
('POL-001', 'Price Variance Threshold Policy', 'Any vendor invoice where the unit price of an item exceeds the 90-day historical moving average by more than 15.0% must immediately be intercepted and flagged for audit review. No automatic ledger disbursement is permitted.', 15.00),
('POL-002', 'Statutory Tax & GST Invariance Policy', 'Every invoice line must precisely compute CGST (9%) and SGST (9%) for intra-state supply, or IGST (18%) for inter-state supply. Any mathematical discrepancy exceeding $0.05 between the line items and statutory tax fields results in an immediate CRITICAL_ANOMALY classification.', 0.00),
('POL-003', 'Duplicate Invoice Interception Policy', 'Under zero circumstances may a vendor submit an invoice with an invoice_number identical to any previously processed or pending invoice for that same vendor. Immediate system lockout and audit alert must trigger.', 0.00),
('POL-004', 'Executive Dual-Authorization Spend Escalation', 'Any procurement order or cumulative vendor balance exceeding $100,000 within a single calendar billing period mandates explicit CFO authorization and cryptographic ledger audit approval.', 10.00);

-- Initial Journal Entries for baseline ledger balance
INSERT INTO journal_entries (entry_number, reference_id, posting_date, status, memo, total_amount, created_by) VALUES
('JE-2026-0001', 'INIT-CAPITAL-001', CURRENT_DATE - INTERVAL '15 day', 'POSTED', 'Initial capital injection and treasury reserve allocation', 1520000.0000, 'SYSTEM_INIT'),
('JE-2026-0002', 'CLOUD-SUB-9081', CURRENT_DATE - INTERVAL '7 day', 'POSTED', 'Monthly enterprise cloud cluster infrastructure settlement', 45000.0000, 'cfo_admin');

-- Lines for JE-2026-0001 (DEBIT Cash 1010, CREDIT Retained Earnings 3010)
INSERT INTO journal_lines (entry_id, account_id, entry_type, amount, line_order, memo) VALUES
(1, (SELECT id FROM accounts WHERE code = '1010'), 'DEBIT', 1520000.0000, 1, 'Cash debit from corporate treasury allocation'),
(1, (SELECT id FROM accounts WHERE code = '3010'), 'CREDIT', 1520000.0000, 2, 'Equity credit for initial retained earnings capitalization');

-- Lines for JE-2026-0002 (DEBIT Cloud Exp 5020, CREDIT Accounts Payable 2010)
INSERT INTO journal_lines (entry_id, account_id, entry_type, amount, line_order, memo) VALUES
(2, (SELECT id FROM accounts WHERE code = '5020'), 'DEBIT', 45000.0000, 1, 'Cloud infrastructure compute debit'),
(2, (SELECT id FROM accounts WHERE code = '2010'), 'CREDIT', 45000.0000, 2, 'Accounts payable credit for CloudScale Networks');

-- Initial Invoices
INSERT INTO invoices (vendor_id, invoice_number, invoice_date, gstin, subtotal, cgst, sgst, igst, total_amount, line_items, fraud_risk_score, triage_status, anomaly_reasons, journal_entry_id) VALUES
(1, 'INV-CS-2026-8801', CURRENT_DATE - INTERVAL '7 day', '27AABCS1429B1Z8', 38135.5900, 3432.2050, 3432.2050, 0.0000, 45000.0000,
 '[{"description": "Production Kubernetes Nodes Cluster H100", "quantity": 10, "unitPrice": 3813.559, "totalPrice": 38135.59}]'::jsonb,
 8, 'AUTO_APPROVED', '[]'::jsonb, 2),
(3, 'INV-NV-2026-9901', CURRENT_DATE - INTERVAL '2 day', '07AAECN9999P1ZK', 82000.0000, 7380.0000, 7380.0000, 0.0000, 96760.0000,
 '[{"description": "Specialized Cryptographic Hardware HSM", "quantity": 5, "unitPrice": 16400.00, "totalPrice": 82000.00}]'::jsonb,
 78, 'FLAGGED_FOR_AUDIT', '["Unit price $16,400.00 represents a 105.0% variance over historical benchmark of $8,000.00", "High vendor risk tier: HIGH"]'::jsonb, NULL);
