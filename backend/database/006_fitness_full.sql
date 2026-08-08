-- ==========================================
-- Fitness — full daily tracking
-- Extends the original weight/workout-only columns
-- so nothing fitness.js tracks lives only in the
-- browser anymore (steps, water, protein, sleep,
-- the 6 daily rules, the day-lock, and photos).
-- ==========================================

ALTER TABLE fitness_entries
  ADD COLUMN IF NOT EXISTS steps            INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS water_l           NUMERIC(4,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS protein_g         INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sleep_hours       NUMERIC(4,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS workout_minutes   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked            BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS rules             JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Progress photos. Stored as data URLs directly in Postgres to satisfy
-- "everything permanent, nothing in the browser" — worth revisiting with
-- real file/object storage later if photos get large or numerous, since
-- base64 in a TEXT column is not the most storage-efficient option.
CREATE TABLE IF NOT EXISTS fitness_photos (
  slot        TEXT PRIMARY KEY,
  data_url    TEXT NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
