-- LifeOS database schema
-- Run with: psql -U postgres -d lifeos -f backend/database/schema.sql

-- Daily Standards: one row per day, each habit scored 0-10
CREATE TABLE IF NOT EXISTS standards_entries (
  id            SERIAL PRIMARY KEY,
  entry_date    DATE NOT NULL UNIQUE,
  sleep         SMALLINT NOT NULL CHECK (sleep BETWEEN 0 AND 10),
  workout       SMALLINT NOT NULL CHECK (workout BETWEEN 0 AND 10),
  diet          SMALLINT NOT NULL CHECK (diet BETWEEN 0 AND 10),
  reading       SMALLINT NOT NULL CHECK (reading BETWEEN 0 AND 10),
  meditation    SMALLINT NOT NULL CHECK (meditation BETWEEN 0 AND 10),
  no_junk       SMALLINT NOT NULL CHECK (no_junk BETWEEN 0 AND 10),
  avg_score     NUMERIC(4,2) GENERATED ALWAYS AS (
                  (sleep + workout + diet + reading + meditation + no_junk) / 6.0
                ) STORED,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Finance: single evolving snapshot + a timeline of historical snapshots
CREATE TABLE IF NOT EXISTS finance_snapshot (
  id              SERIAL PRIMARY KEY,
  bank_balance    NUMERIC(14,2) NOT NULL DEFAULT 0,
  market_funds    NUMERIC(14,2) NOT NULL DEFAULT 0,
  emergency_fund  NUMERIC(14,2) NOT NULL DEFAULT 0,
  wealth_engine   NUMERIC(14,2) NOT NULL DEFAULT 0,
  goal_amount     NUMERIC(14,2) NOT NULL DEFAULT 5000000, -- ₹50 lakh default
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS finance_history (
  id              SERIAL PRIMARY KEY,
  recorded_on     DATE NOT NULL DEFAULT CURRENT_DATE,
  total_wealth    NUMERIC(14,2) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fitness
CREATE TABLE IF NOT EXISTS fitness_goal (
  id            SERIAL PRIMARY KEY,
  goal_weight   NUMERIC(5,2) NOT NULL DEFAULT 80,
  start_weight  NUMERIC(5,2)
);

CREATE TABLE IF NOT EXISTS fitness_entries (
  id            SERIAL PRIMARY KEY,
  entry_date    DATE NOT NULL UNIQUE,
  weight        NUMERIC(5,2),
  workout_done  BOOLEAN NOT NULL DEFAULT false,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Vision board
CREATE TABLE IF NOT EXISTS vision_goals (
  id            SERIAL PRIMARY KEY,
  title         TEXT NOT NULL,
  description   TEXT,
  image_url     TEXT,
  category      TEXT,
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed one finance snapshot and one fitness goal row so the app has
-- something to show on first load.
INSERT INTO finance_snapshot (bank_balance, market_funds, emergency_fund, goal_amount)
  SELECT 0, 0, 0, 5000000
  WHERE NOT EXISTS (SELECT 1 FROM finance_snapshot);

INSERT INTO fitness_goal (goal_weight)
  SELECT 80
  WHERE NOT EXISTS (SELECT 1 FROM fitness_goal);
