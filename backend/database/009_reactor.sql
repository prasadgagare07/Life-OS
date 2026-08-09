-- Dream Reactor journal: logs the things that charge your dream life
-- (type = 'charge') and the things that crack it (type = 'leak'),
-- one row per entry, grouped by the day they were logged.

CREATE TABLE IF NOT EXISTS reactor_entries (
  id SERIAL PRIMARY KEY,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT NOT NULL CHECK (type IN ('charge', 'leak')),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reactor_entries_date ON reactor_entries (entry_date);
