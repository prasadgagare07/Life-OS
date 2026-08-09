CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page TEXT NOT NULL,
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ
);

-- Fast lookups when checking/updating a specific session on every request.
CREATE INDEX IF NOT EXISTS idx_sessions_page ON sessions (page);

-- Needed for gen_random_uuid() on some Postgres setups.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
