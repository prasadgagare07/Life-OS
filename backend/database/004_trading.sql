-- ==========================================
-- Trade Guardian — daily trading journal
-- ==========================================

CREATE TABLE IF NOT EXISTS trading_entries (
    id          SERIAL PRIMARY KEY,
    entry_date  DATE UNIQUE NOT NULL,
    profit      NUMERIC(14,2) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trading_entries_date
ON trading_entries(entry_date);

-- Time Explorer's "actual" table needs a column for the pre-diversification
-- Trade Guardian cash pile (post-diversification actuals already had
-- freedom_fund / savings / emergency_fund columns from 003_time_explorer.sql).
ALTER TABLE financial_actual_history
  ADD COLUMN IF NOT EXISTS trade_guardian_cash NUMERIC(14,2) DEFAULT 0;

ALTER TABLE financial_actual_history
  ADD COLUMN IF NOT EXISTS is_diversified BOOLEAN DEFAULT FALSE;
