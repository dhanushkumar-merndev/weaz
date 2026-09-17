-- Whether the module's Google Slides deck is editable by anyone with the link,
-- as observed at the last sync. NULL means it could not be determined.
ALTER TABLE public.course_modules
  ADD COLUMN IF NOT EXISTS public_edit_access BOOLEAN;
