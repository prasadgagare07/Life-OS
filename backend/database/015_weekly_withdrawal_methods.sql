-- ==========================================
-- WEEKLY WITHDRAWAL — WITHDRAWAL METHODS
-- Adds payout-method details + status to
-- each withdrawal history row.
-- ==========================================

ALTER TABLE weekly_withdrawal_history
  ADD COLUMN IF NOT EXISTS method TEXT,
  ADD COLUMN IF NOT EXISTS upi_id TEXT,
  ADD COLUMN IF NOT EXISTS account_number TEXT,
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS ifsc_code TEXT,
  ADD COLUMN IF NOT EXISTS wallet_address TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'success';
