-- ==========================================
-- Finance — store the full daily breakdown
-- (not just total_wealth) so the calendar can
-- show every category's balance for any date.
-- ==========================================

ALTER TABLE finance_history
  ADD COLUMN IF NOT EXISTS bank_balance   NUMERIC(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS market_funds   NUMERIC(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS emergency_fund NUMERIC(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS goal_amount    NUMERIC(14,2) NOT NULL DEFAULT 0;

-- One entry per day going forward.
CREATE UNIQUE INDEX IF NOT EXISTS idx_finance_history_recorded_on
  ON finance_history(recorded_on);
