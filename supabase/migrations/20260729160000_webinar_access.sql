ALTER TABLE public.webinars
  ADD COLUMN IF NOT EXISTS whatsapp_group_url TEXT;

ALTER TABLE public.webinars
  DROP CONSTRAINT IF EXISTS webinars_whatsapp_group_url_check;
ALTER TABLE public.webinars
  ADD CONSTRAINT webinars_whatsapp_group_url_check
  CHECK (
    whatsapp_group_url IS NULL
    OR whatsapp_group_url ~ '^https://chat\.whatsapp\.com/[A-Za-z0-9_-]+'
  );

-- Keep the newest visible webinar active before adding the uniqueness rule.
WITH visible_webinars AS (
  SELECT
    id,
    row_number() OVER (ORDER BY created_at DESC, id DESC) AS visible_rank
  FROM public.webinars
  WHERE is_visible = TRUE
)
UPDATE public.webinars
SET is_visible = FALSE, updated_at = NOW()
WHERE id IN (
  SELECT id FROM visible_webinars WHERE visible_rank > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_webinars_only_one_visible
  ON public.webinars ((is_visible))
  WHERE is_visible = TRUE;

CREATE OR REPLACE FUNCTION public.activate_webinar(target_webinar_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.webinars WHERE id = target_webinar_id
  ) THEN
    RAISE EXCEPTION 'Webinar not found';
  END IF;

  UPDATE public.webinars
  SET
    is_visible = (id = target_webinar_id),
    updated_at = CASE
      WHEN is_visible IS DISTINCT FROM (id = target_webinar_id) THEN NOW()
      ELSE updated_at
    END;
END;
$$;

REVOKE ALL ON FUNCTION public.activate_webinar(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.activate_webinar(UUID) TO service_role;
