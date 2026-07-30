CREATE OR REPLACE FUNCTION public.get_webinar_registration_counts()
RETURNS TABLE (
  webinar_id UUID,
  total_count BIGINT,
  paid_count BIGINT
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    registrations.webinar_id,
    COUNT(*)::BIGINT AS total_count,
    COUNT(*) FILTER (WHERE registrations.status = 'paid')::BIGINT AS paid_count
  FROM public.webinar_registrations AS registrations
  GROUP BY registrations.webinar_id;
$$;

REVOKE ALL ON FUNCTION public.get_webinar_registration_counts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_webinar_registration_counts() TO service_role;
