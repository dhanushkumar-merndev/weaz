-- Enable RLS
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Programs: anyone can read (anon + authenticated)
CREATE POLICY "programs_select_public"
  ON programs FOR SELECT
  USING (true);

-- Programs: only service_role can insert/update/delete (handled via API)
-- (no policy = default deny for anon/authenticated)

-- Enrollments: user can read own enrollments
CREATE POLICY "enrollments_select_own"
  ON enrollments FOR SELECT
  USING (auth.uid()::text = user_id);

-- Enrollment creation and payment-state changes are server-only operations.
-- Server routes use the service_role; browser clients may only read their rows.
REVOKE INSERT, UPDATE, DELETE ON TABLE enrollments FROM anon, authenticated;
