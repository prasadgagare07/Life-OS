-- ==========================================
-- WEEKLY WITHDRAWAL ACCOUNT
-- ==========================================

CREATE TABLE IF NOT EXISTS weekly_withdrawal_account (
    id              SERIAL PRIMARY KEY,
    account_name    TEXT NOT NULL DEFAULT 'WEEKLY WITHDRAWAL',
    current_funds   NUMERIC(14,2) NOT NULL DEFAULT 0,
    surplus_vault   NUMERIC(14,2) NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- Only one WEEKLY WITHDRAWAL account
INSERT INTO weekly_withdrawal_account
    (account_name, current_funds, surplus_vault)
SELECT
    'WEEKLY WITHDRAWAL',
    0,
    0
WHERE NOT EXISTS (
    SELECT 1
    FROM weekly_withdrawal_account
);


-- ==========================================
-- DAILY PROFIT
-- ==========================================

CREATE TABLE IF NOT EXISTS weekly_withdrawal_entries (
    id              SERIAL PRIMARY KEY,
    entry_date      DATE UNIQUE NOT NULL,
    profit          NUMERIC(14,2) NOT NULL,
    withdrawal_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    surplus_amount  NUMERIC(14,2) NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_weekly_withdrawal_entries_date
ON weekly_withdrawal_entries(entry_date);


-- ==========================================
-- WITHDRAWAL HISTORY
-- ==========================================

CREATE TABLE IF NOT EXISTS weekly_withdrawal_history (
    id              SERIAL PRIMARY KEY,
    withdrawal_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount          NUMERIC(14,2) NOT NULL,
    source          TEXT NOT NULL DEFAULT 'WEEKLY WITHDRAWAL',
    note            TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_weekly_withdrawal_history_date
ON weekly_withdrawal_history(withdrawal_date);
