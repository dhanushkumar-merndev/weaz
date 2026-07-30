-- Razorpay order amounts are immutable. Keep the price that each registration
-- was created with so later webinar price edits only affect new checkouts.
ALTER TABLE public.webinar_registrations
  ADD COLUMN IF NOT EXISTS amount_paise BIGINT;

ALTER TABLE public.webinar_registrations
  DROP CONSTRAINT IF EXISTS webinar_registrations_amount_paise_check;
ALTER TABLE public.webinar_registrations
  ADD CONSTRAINT webinar_registrations_amount_paise_check
  CHECK (amount_paise IS NULL OR amount_paise > 0);
