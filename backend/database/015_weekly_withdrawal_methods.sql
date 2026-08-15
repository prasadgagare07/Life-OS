-- ==========================================
-- WEEKLY WITHDRAWAL — WITHDRAWAL METHODS
-- Adds a saved default payout method to the
-- account, and per-transaction method/status
-- details to each withdrawal history row.
-- ==========================================

ALTER TABLE weekly_withdrawal_account
  ADD COLUMN IF NOT EXISTS withdrawal_method TEXT,
  ADD COLUMN IF NOT EXISTS upi_id TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS ifsc_code TEXT,
  ADD COLUMN IF NOT EXISTS wallet_address TEXT;

ALTER TABLE weekly_withdrawal_history
  ADD COLUMN IF NOT EXISTS withdrawal_method TEXT,
  ADD COLUMN IF NOT EXISTS upi_id TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS ifsc_code TEXT,
  ADD COLUMN IF NOT EXISTS wallet_address TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'success';
