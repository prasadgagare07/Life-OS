-- LifeOS now uses a separate passcode per page instead of one shared
-- passcode for the whole app. This migration reshapes auth_settings from
-- a single row to one row per page (page = 'dashboard', 'finance', etc.).

ALTER TABLE auth_settings ADD COLUMN IF NOT EXISTS page TEXT;

-- Any pre-existing row is from the old single-passcode scheme and doesn't
-- map to a specific page, so it's dropped in favor of the fresh per-page
-- rows that server.js seeds with known default passcodes.
DELETE FROM auth_settings WHERE page IS NULL;

ALTER TABLE auth_settings ALTER COLUMN page SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'auth_settings_page_key'
  ) THEN
    ALTER TABLE auth_settings ADD CONSTRAINT auth_settings_page_key UNIQUE (page);
  END IF;
END $$;
