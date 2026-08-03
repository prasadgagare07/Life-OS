CREATE TABLE IF NOT EXISTS auth_settings (
  id SERIAL PRIMARY KEY,
  passcode_hash TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
