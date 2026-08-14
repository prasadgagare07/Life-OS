-- ==========================================
-- WEEKLY WITHDRAWAL — V2
-- Adds withdrawal counting + surplus vault
-- release tracking (every 15th withdrawal).
-- ==========================================

ALTER TABLE weekly_withdrawal_account
  ADD COLUMN IF NOT EXISTS withdrawal_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE weekly_withdrawal_history
  ADD COLUMN IF NOT EXISTS profit NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS surplus_amount NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS withdrawal_number INTEGER,
  ADD COLUMN IF NOT EXISTS vault_released NUMERIC(14,2);
