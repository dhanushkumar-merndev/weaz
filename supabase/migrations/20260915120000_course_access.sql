BEGIN;

-- 1. Stable course slugs ----------------------------------------------------
-- Course content lives in the app (src/content/courses.ts) and is matched to a
-- program by slug, so renaming or repricing a program never orphans content.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.programs
    WHERE price_paise IN (3500000, 4999900, 6000000)
    GROUP BY price_paise
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Duplicate program rows share a course price. Reconcile them before applying this migration.';
  END IF;
END
$$;

ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS slug TEXT;

UPDATE public.programs
SET slug = CASE price_paise
  WHEN 3500000 THEN 'beginner'
  WHEN 4999900 THEN 'professional'
  WHEN 6000000 THEN 'ai-hero'
END
WHERE slug IS NULL
  AND price_paise IN (3500000, 4999900, 6000000);

CREATE UNIQUE INDEX IF NOT EXISTS idx_programs_slug_unique
  ON public.programs (slug)
  WHERE slug IS NOT NULL;

-- 2. Manual course access ---------------------------------------------------
-- Paid enrollments unlock a course automatically. These rows let an admin
-- unlock a course by hand (offline payment, scholarship, staff, etc.).

CREATE TABLE IF NOT EXISTS public.course_access_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  program_id INTEGER NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  granted_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, program_id)
);

CREATE INDEX IF NOT EXISTS idx_course_access_grants_user
  ON public.course_access_grants (user_id);

ALTER TABLE public.course_access_grants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own course access grants" ON public.course_access_grants;
CREATE POLICY "Users can view own course access grants"
  ON public.course_access_grants FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

REVOKE INSERT, UPDATE, DELETE ON public.course_access_grants FROM anon, authenticated;

-- 3. Google Slides decks per module -----------------------------------------
-- Served only through authorised API routes, never read directly by browsers.

CREATE TABLE IF NOT EXISTS public.course_module_slides (
  program_id INTEGER NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  module_key TEXT NOT NULL CHECK (module_key ~ '^[a-z0-9-]{2,60}$'),
  slides_url TEXT NOT NULL CHECK (slides_url LIKE 'https://docs.google.com/presentation/%'),
  updated_by TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (program_id, module_key)
);

ALTER TABLE public.course_module_slides ENABLE ROW LEVEL SECURITY;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.course_module_slides
  FROM anon, authenticated;

COMMIT;
