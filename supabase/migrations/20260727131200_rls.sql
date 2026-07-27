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

-- Enrollments: user can insert own enrollment
CREATE POLICY "enrollments_insert_own"
  ON enrollments FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Enrollments: user can update own enrollment (for payment flow)
CREATE POLICY "enrollments_update_own"
  ON enrollments FOR UPDATE
  USING (auth.uid()::text = user_id);

-- Enrollments: only service_role can update any enrollment (webhook)
-- (explicitly allowed via service_role key, no additional policy needed)
