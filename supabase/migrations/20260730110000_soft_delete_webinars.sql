ALTER TABLE public.webinars
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_webinars_deleted_created
  ON public.webinars (deleted_at, created_at DESC);

DROP POLICY IF EXISTS "Public can view visible webinars" ON public.webinars;
CREATE POLICY "Public can view visible webinars"
  ON public.webinars FOR SELECT
  TO anon, authenticated
  USING (is_visible = TRUE AND deleted_at IS NULL);

CREATE OR REPLACE FUNCTION public.activate_webinar(target_webinar_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Serialize activations so concurrent admin requests cannot race each other.
  PERFORM pg_advisory_xact_lock(hashtext('public.activate_webinar'));

  IF NOT EXISTS (
    SELECT 1
    FROM public.webinars
    WHERE id = target_webinar_id
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Webinar not found';
  END IF;

  UPDATE public.webinars
  SET
    is_visible = FALSE,
    updated_at = NOW()
  WHERE is_visible = TRUE
    AND id <> target_webinar_id;

  UPDATE public.webinars
  SET
    is_visible = TRUE,
    updated_at = CASE
      WHEN is_visible IS DISTINCT FROM TRUE THEN NOW()
      ELSE updated_at
    END
  WHERE id = target_webinar_id
    AND deleted_at IS NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.activate_webinar(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.activate_webinar(UUID) TO service_role;
