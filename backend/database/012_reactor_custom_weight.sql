-- ==========================================
-- Dream Reactor — custom per-entry impact %
-- Was a fixed +12/-8 per entry; now you type your
-- own weight when logging (can go above 100 for
-- especially high-impact habits).
-- ==========================================

ALTER TABLE reactor_entries
  ADD COLUMN IF NOT EXISTS weight NUMERIC(6,2);

-- Back-fill existing entries with the old fixed values so history keeps
-- its original effective weight instead of turning into NULL/zero.
UPDATE reactor_entries
SET weight = CASE WHEN type = 'charge' THEN 12 ELSE 8 END
WHERE weight IS NULL;

ALTER TABLE reactor_entries
  ALTER COLUMN weight SET NOT NULL,
  ALTER COLUMN weight SET DEFAULT 12;
