-- Configurable free webinar registration slots.
--
-- Free slots are allocated by an atomic conditional UPDATE inside a single
-- database transaction, so two concurrent requests can never both take the
-- last remaining slot. The database is the only source of truth: no cache,
-- no server memory and no browser value participates in the allocation.

BEGIN;

-- 1. Webinar free-registration settings ------------------------------------

ALTER TABLE public.webinars
  ADD COLUMN IF NOT EXISTS free_registration_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS free_slot_limit INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS free_slots_claimed INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS free_registration_starts_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS free_registration_ends_at TIMESTAMPTZ;

ALTER TABLE public.webinars
  DROP CONSTRAINT IF EXISTS webinars_free_slot_limit_check;
ALTER TABLE public.webinars
  ADD CONSTRAINT webinars_free_slot_limit_check
  CHECK (free_slot_limit >= 0 AND free_slot_limit <= 1000000);

ALTER TABLE public.webinars
  DROP CONSTRAINT IF EXISTS webinars_free_slots_claimed_check;
ALTER TABLE public.webinars
  ADD CONSTRAINT webinars_free_slots_claimed_check
  CHECK (free_slots_claimed >= 0);

-- The admin may raise or lower the free-slot limit at any time, but never
-- below the number of free slots that have already been handed out.
ALTER TABLE public.webinars
  DROP CONSTRAINT IF EXISTS webinars_free_slots_within_limit_check;
ALTER TABLE public.webinars
  ADD CONSTRAINT webinars_free_slots_within_limit_check
  CHECK (free_slots_claimed <= free_slot_limit);

ALTER TABLE public.webinars
  DROP CONSTRAINT IF EXISTS webinars_free_registration_window_check;
ALTER TABLE public.webinars
  ADD CONSTRAINT webinars_free_registration_window_check
  CHECK (
    free_registration_starts_at IS NULL
    OR free_registration_ends_at IS NULL
    OR free_registration_ends_at > free_registration_starts_at
  );

-- The private group link must never be readable through the public anon or
-- authenticated Supabase keys. A table-level SELECT grant always covers every
-- column, so it is replaced with an explicit safe column list. Server routes
-- use the service role, which is not affected by column privileges.
REVOKE SELECT ON public.webinars FROM anon, authenticated;
GRANT SELECT (
  id,
  title,
  announcement_text,
  description,
  price_paise,
  image_path,
  starts_at,
  is_visible,
  created_at,
  updated_at,
  deleted_at,
  free_registration_enabled,
  free_slot_limit,
  free_slots_claimed,
  free_registration_starts_at,
  free_registration_ends_at
) ON public.webinars TO anon, authenticated;

-- 2. Registration type, contact identity and explicit statuses -------------

ALTER TABLE public.webinar_registrations
  ADD COLUMN IF NOT EXISTS registration_type TEXT NOT NULL DEFAULT 'PAID',
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS registered_at TIMESTAMPTZ;

UPDATE public.webinar_registrations
SET registered_at = created_at
WHERE registered_at IS NULL;

ALTER TABLE public.webinar_registrations
  ALTER COLUMN registered_at SET DEFAULT NOW();
ALTER TABLE public.webinar_registrations
  ALTER COLUMN registered_at SET NOT NULL;

-- Free registrations are stored with a zero amount.
ALTER TABLE public.webinar_registrations
  DROP CONSTRAINT IF EXISTS webinar_registrations_amount_paise_check;
ALTER TABLE public.webinar_registrations
  ADD CONSTRAINT webinar_registrations_amount_paise_check
  CHECK (amount_paise IS NULL OR amount_paise >= 0);

ALTER TABLE public.webinar_registrations
  DROP CONSTRAINT IF EXISTS webinar_registrations_registration_type_check;
ALTER TABLE public.webinar_registrations
  ADD CONSTRAINT webinar_registrations_registration_type_check
  CHECK (registration_type IN ('FREE', 'PAID'));

-- Replace the legacy pending/paid values with the explicit status set.
ALTER TABLE public.webinar_registrations
  DROP CONSTRAINT IF EXISTS webinar_registrations_status_check;

UPDATE public.webinar_registrations
SET status = 'PAID_CONFIRMED'
WHERE status = 'paid';

UPDATE public.webinar_registrations
SET status = 'PAYMENT_PENDING'
WHERE status = 'pending';

ALTER TABLE public.webinar_registrations
  ALTER COLUMN status SET DEFAULT 'PAYMENT_PENDING';
ALTER TABLE public.webinar_registrations
  ADD CONSTRAINT webinar_registrations_status_check
  CHECK (
    status IN (
      'FREE_CONFIRMED',
      'PAYMENT_PENDING',
      'PAID_CONFIRMED',
      'PAYMENT_FAILED',
      'CANCELLED'
    )
  );

-- Backfill the contact identity columns from the stored form data.
UPDATE public.webinar_registrations
SET
  contact_email = NULLIF(lower(trim(form_data->>'email')), ''),
  contact_phone = NULLIF(
    regexp_replace(COALESCE(form_data->>'phone', ''), '\D', '', 'g'),
    ''
  )
WHERE contact_email IS NULL
  AND contact_phone IS NULL;

-- Legacy rows may already hold a duplicate confirmed email or phone for the
-- same webinar. Keep the oldest confirmed registration authoritative and drop
-- only the duplicated lookup values; the original values stay in form_data so
-- no registration or payment history is lost.
WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY webinar_id, contact_email
      ORDER BY registered_at, created_at, id
    ) AS email_rank
  FROM public.webinar_registrations
  WHERE contact_email IS NOT NULL
    AND status IN ('FREE_CONFIRMED', 'PAID_CONFIRMED')
)
UPDATE public.webinar_registrations AS registrations
SET contact_email = NULL
FROM ranked
WHERE registrations.id = ranked.id
  AND ranked.email_rank > 1;

WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY webinar_id, contact_phone
      ORDER BY registered_at, created_at, id
    ) AS phone_rank
  FROM public.webinar_registrations
  WHERE contact_phone IS NOT NULL
    AND status IN ('FREE_CONFIRMED', 'PAID_CONFIRMED')
)
UPDATE public.webinar_registrations AS registrations
SET contact_phone = NULL
FROM ranked
WHERE registrations.id = ranked.id
  AND ranked.phone_rank > 1;

-- The same person cannot hold two confirmed registrations for one webinar.
-- Abandoned PAYMENT_PENDING, PAYMENT_FAILED and CANCELLED rows are excluded so
-- a user can always retry a failed checkout.
CREATE UNIQUE INDEX IF NOT EXISTS idx_webinar_registrations_email_unique
  ON public.webinar_registrations (webinar_id, contact_email)
  WHERE contact_email IS NOT NULL
    AND status IN ('FREE_CONFIRMED', 'PAID_CONFIRMED');

CREATE UNIQUE INDEX IF NOT EXISTS idx_webinar_registrations_phone_unique
  ON public.webinar_registrations (webinar_id, contact_phone)
  WHERE contact_phone IS NOT NULL
    AND status IN ('FREE_CONFIRMED', 'PAID_CONFIRMED');

CREATE INDEX IF NOT EXISTS idx_webinar_registrations_webinar_status
  ON public.webinar_registrations (webinar_id, status);

-- Existing registrations were all paid checkouts.
UPDATE public.webinar_registrations
SET registration_type = 'PAID'
WHERE registration_type IS DISTINCT FROM 'PAID'
  AND status <> 'FREE_CONFIRMED';

-- 3. Atomic free-slot allocation -------------------------------------------

CREATE OR REPLACE FUNCTION public.claim_webinar_free_slot(
  target_webinar_id UUID,
  target_user_id TEXT,
  target_email TEXT,
  target_phone TEXT,
  target_form_data JSONB
)
RETURNS TABLE (
  result_code TEXT,
  claimed_registration_id UUID,
  slot_limit INTEGER,
  slots_claimed INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  webinar_row public.webinars%ROWTYPE;
  existing_id UUID;
  taken INTEGER;
  created_id UUID;
  normalized_email TEXT := NULLIF(lower(trim(COALESCE(target_email, ''))), '');
  normalized_phone TEXT := NULLIF(
    regexp_replace(COALESCE(target_phone, ''), '\D', '', 'g'),
    ''
  );
  now_ts TIMESTAMPTZ := NOW();
BEGIN
  SELECT * INTO webinar_row
  FROM public.webinars
  WHERE id = target_webinar_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 'WEBINAR_NOT_FOUND'::TEXT, NULL::UUID, 0, 0;
    RETURN;
  END IF;

  -- An already confirmed registration never consumes a second slot.
  SELECT id INTO existing_id
  FROM public.webinar_registrations
  WHERE webinar_id = target_webinar_id
    AND status IN ('FREE_CONFIRMED', 'PAID_CONFIRMED')
    AND (
      user_id = target_user_id
      OR (normalized_email IS NOT NULL AND contact_email = normalized_email)
      OR (normalized_phone IS NOT NULL AND contact_phone = normalized_phone)
    )
  ORDER BY registered_at
  LIMIT 1;

  IF existing_id IS NOT NULL THEN
    RETURN QUERY SELECT
      'ALREADY_REGISTERED'::TEXT,
      existing_id,
      webinar_row.free_slot_limit,
      webinar_row.free_slots_claimed;
    RETURN;
  END IF;

  IF webinar_row.free_registration_enabled IS NOT TRUE
    OR webinar_row.free_slot_limit <= 0
    OR (
      webinar_row.free_registration_starts_at IS NOT NULL
      AND now_ts < webinar_row.free_registration_starts_at
    )
    OR (
      webinar_row.free_registration_ends_at IS NOT NULL
      AND now_ts >= webinar_row.free_registration_ends_at
    )
  THEN
    RETURN QUERY SELECT
      'FREE_UNAVAILABLE'::TEXT,
      NULL::UUID,
      webinar_row.free_slot_limit,
      webinar_row.free_slots_claimed;
    RETURN;
  END IF;

  -- The single conditional UPDATE is the allocation. Postgres serializes the
  -- row write, so exactly one concurrent request can take the final slot.
  UPDATE public.webinars AS w
  SET
    free_slots_claimed = w.free_slots_claimed + 1,
    updated_at = now_ts
  WHERE w.id = target_webinar_id
    AND w.deleted_at IS NULL
    AND w.free_registration_enabled = TRUE
    AND w.free_slots_claimed < w.free_slot_limit
    AND (
      w.free_registration_starts_at IS NULL
      OR w.free_registration_starts_at <= now_ts
    )
    AND (
      w.free_registration_ends_at IS NULL
      OR w.free_registration_ends_at > now_ts
    )
  RETURNING w.free_slots_claimed INTO taken;

  IF taken IS NULL THEN
    SELECT w.free_slot_limit, w.free_slots_claimed
    INTO webinar_row.free_slot_limit, webinar_row.free_slots_claimed
    FROM public.webinars AS w
    WHERE w.id = target_webinar_id;

    RETURN QUERY SELECT
      'FREE_SLOTS_EXHAUSTED'::TEXT,
      NULL::UUID,
      webinar_row.free_slot_limit,
      webinar_row.free_slots_claimed;
    RETURN;
  END IF;

  -- The claim and the registration row are written in the same transaction,
  -- so a failed insert also rolls the claimed counter back.
  INSERT INTO public.webinar_registrations (
    user_id,
    webinar_id,
    status,
    registration_type,
    amount_paise,
    contact_email,
    contact_phone,
    form_data,
    registered_at,
    created_at,
    updated_at
  )
  VALUES (
    target_user_id,
    target_webinar_id,
    'FREE_CONFIRMED',
    'FREE',
    0,
    normalized_email,
    normalized_phone,
    COALESCE(target_form_data, '{}'::JSONB),
    now_ts,
    now_ts,
    now_ts
  )
  RETURNING id INTO created_id;

  -- Any abandoned checkout for the same person is closed out so the webinar
  -- admin list shows one row per attendee.
  UPDATE public.webinar_registrations
  SET status = 'CANCELLED', updated_at = now_ts
  WHERE webinar_id = target_webinar_id
    AND user_id = target_user_id
    AND id <> created_id
    AND status = 'PAYMENT_PENDING'
    AND razorpay_payment_id IS NULL
    AND razorpay_order_id IS NULL;

  RETURN QUERY SELECT
    'FREE_CONFIRMED'::TEXT,
    created_id,
    webinar_row.free_slot_limit,
    taken;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_webinar_free_slot(UUID, TEXT, TEXT, TEXT, JSONB)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_webinar_free_slot(UUID, TEXT, TEXT, TEXT, JSONB)
  TO service_role;

-- 4. Admin dashboard counters ----------------------------------------------

DROP FUNCTION IF EXISTS public.get_webinar_registration_counts();

CREATE OR REPLACE FUNCTION public.get_webinar_registration_counts()
RETURNS TABLE (
  webinar_id UUID,
  total_count BIGINT,
  paid_count BIGINT,
  free_count BIGINT,
  pending_count BIGINT,
  failed_count BIGINT,
  cancelled_count BIGINT
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    registrations.webinar_id,
    COUNT(*) FILTER (
      WHERE registrations.status IN (
        'FREE_CONFIRMED', 'PAID_CONFIRMED', 'PAYMENT_PENDING'
      )
    )::BIGINT AS total_count,
    COUNT(*) FILTER (WHERE registrations.status = 'PAID_CONFIRMED')::BIGINT
      AS paid_count,
    COUNT(*) FILTER (WHERE registrations.status = 'FREE_CONFIRMED')::BIGINT
      AS free_count,
    COUNT(*) FILTER (WHERE registrations.status = 'PAYMENT_PENDING')::BIGINT
      AS pending_count,
    COUNT(*) FILTER (WHERE registrations.status = 'PAYMENT_FAILED')::BIGINT
      AS failed_count,
    COUNT(*) FILTER (WHERE registrations.status = 'CANCELLED')::BIGINT
      AS cancelled_count
  FROM public.webinar_registrations AS registrations
  GROUP BY registrations.webinar_id;
$$;

REVOKE ALL ON FUNCTION public.get_webinar_registration_counts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_webinar_registration_counts() TO service_role;

-- 5. Admin audit log --------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  changes JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created
  ON public.admin_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_entity
  ON public.admin_audit_log (entity_type, entity_id, created_at DESC);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.admin_audit_log
  FROM anon, authenticated;

COMMIT;
