-- Reactor Race: good points (+1/charge) vs bad points (-2/leak) racing to
-- a target of 100. Whoever gets there first wins; the race then resets.
-- Only one race is ever "open" (resolved_at IS NULL) at a time.
CREATE TABLE IF NOT EXISTS reactor_races (
  id SERIAL PRIMARY KEY,
  race_number INT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  winner TEXT CHECK (winner IN ('good', 'bad')),
  lockdown_until TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_reactor_races_open
  ON reactor_races (resolved_at) WHERE resolved_at IS NULL;

-- Seed race #1 if the table is empty.
INSERT INTO reactor_races (race_number, started_at)
SELECT 1, now()
WHERE NOT EXISTS (SELECT 1 FROM reactor_races);
