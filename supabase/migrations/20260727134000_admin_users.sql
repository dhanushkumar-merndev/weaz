CREATE TABLE IF NOT EXISTS admin_users (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Only service_role can manage admin_users
-- No public policies = default deny for anon/authenticated

-- Seed initial admins (add others via DB)
INSERT INTO admin_users (email) VALUES
  ('dkstaph@gmail.com'),
  ('weaztechnology@gmail.com')
ON CONFLICT DO NOTHING;
