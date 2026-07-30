-- Flexible daily standards entries.
-- Replaces the rigid 6-fixed-habit "standards_entries" table with a
-- JSONB-based table that supports any number of custom habits.

CREATE TABLE IF NOT EXISTS daily_entries (
  id          SERIAL PRIMARY KEY,
  entry_date  DATE NOT NULL UNIQUE,
  habits      JSONB NOT NULL,
  avg_score   NUMERIC(4,2) NOT NULL,
  locked      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_daily_entries_date ON daily_entries (entry_date DESC);
