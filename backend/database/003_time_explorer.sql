-- ==========================================
-- Financial Time Explorer
-- ==========================================

CREATE TABLE IF NOT EXISTS financial_snapshots (

    id SERIAL PRIMARY KEY,

    snapshot_date DATE UNIQUE NOT NULL,

    freedom_fund NUMERIC(14,2) DEFAULT 0,

    savings NUMERIC(14,2) DEFAULT 0,

    emergency_fund NUMERIC(14,2) DEFAULT 0,

    deployed_capital NUMERIC(14,2) DEFAULT 0,

    backup_savings NUMERIC(14,2) DEFAULT 0,

    total_income NUMERIC(14,2) DEFAULT 0,

    daily_income NUMERIC(14,2) DEFAULT 0,

    is_diversified BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT NOW(),

    updated_at TIMESTAMP DEFAULT NOW()

);

CREATE INDEX IF NOT EXISTS idx_financial_snapshots_date
ON financial_snapshots(snapshot_date);



-- ==========================================
-- Actual Daily History
-- ==========================================

CREATE TABLE IF NOT EXISTS financial_actual_history (

    id SERIAL PRIMARY KEY,

    history_date DATE UNIQUE NOT NULL,

    freedom_fund NUMERIC(14,2) DEFAULT 0,

    savings NUMERIC(14,2) DEFAULT 0,

    emergency_fund NUMERIC(14,2) DEFAULT 0,

    created_at TIMESTAMP DEFAULT NOW()

);

CREATE INDEX IF NOT EXISTS idx_financial_actual_date
ON financial_actual_history(history_date);
