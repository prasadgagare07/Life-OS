-- ==========================================
-- Trade Guardian — account details (UPI / bank)
-- Was localStorage-only; moving to Postgres so it
-- survives clearing browser data or switching devices.
-- ==========================================

CREATE TABLE IF NOT EXISTS trading_account (
  id         SERIAL PRIMARY KEY,
  upi_id     TEXT,
  bank_name  TEXT
);

INSERT INTO trading_account (upi_id, bank_name)
SELECT NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM trading_account);
