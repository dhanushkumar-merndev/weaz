-- Production enables a safe-update guard that rejects UPDATE statements without
-- a WHERE clause. Keep activation atomic while explicitly scoping both updates.
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
  WHERE id = target_webinar_id;
END;
$$;

REVOKE ALL ON FUNCTION public.activate_webinar(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.activate_webinar(UUID) TO service_role;
