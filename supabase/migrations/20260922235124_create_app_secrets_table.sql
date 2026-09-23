/*
# Store Groq API key for edge function access

1. New Tables
- `app_secrets` — a simple key-value table for storing API keys that edge functions need.
  - `key` (text, primary key) — the secret name
  - `value` (text) — the secret value
  - `created_at` (timestamptz)
2. Security
- Enable RLS on `app_secrets`.
- Deny access to anon and authenticated roles — only the service_role (used by edge functions) should read secrets.
- No SELECT/INSERT/UPDATE/DELETE policies for anon or authenticated = deny by default.
*/

CREATE TABLE IF NOT EXISTS app_secrets (
  key text PRIMARY KEY,
  value text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE app_secrets ENABLE ROW LEVEL SECURITY;

-- No policies for anon/authenticated = deny all access to frontend clients.
-- Edge functions use the service_role key which bypasses RLS.

INSERT INTO app_secrets (key, value) VALUES ('GROQ_API_KEY', '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')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;