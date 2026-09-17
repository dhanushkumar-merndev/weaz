BEGIN;

-- Admin-managed course modules. Each module is one Google Slides deck; the
-- text of every slide is read through the Google Slides API and stored in
-- `slides` so learners never wait on Google. A course with no rows here keeps
-- showing the built-in modules from src/content/courses.ts.

CREATE TABLE IF NOT EXISTS public.course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id INTEGER NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 2 AND 120),
  summary TEXT NOT NULL DEFAULT '' CHECK (char_length(summary) <= 500),
  slides_url TEXT NOT NULL CHECK (slides_url LIKE 'https://docs.google.com/presentation/%'),
  presentation_id TEXT NOT NULL CHECK (presentation_id ~ '^[A-Za-z0-9_-]{20,}$'),
  slides JSONB NOT NULL DEFAULT '[]',
  synced_at TIMESTAMPTZ,
  position INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_modules_program_position
  ON public.course_modules (program_id, position, created_at);

ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.course_modules
  FROM anon, authenticated;

-- course_modules replaces the one-link-per-built-in-module table. Drop it only
-- while it is still empty so no saved link is ever lost.
DO $$
BEGIN
  IF to_regclass('public.course_module_slides') IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.course_module_slides) THEN
    DROP TABLE public.course_module_slides;
  END IF;
END
$$;

COMMIT;
