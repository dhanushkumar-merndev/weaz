CREATE TABLE IF NOT EXISTS public.webinars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 2 AND 120),
  announcement_text TEXT NOT NULL CHECK (char_length(announcement_text) BETWEEN 2 AND 180),
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 2 AND 2000),
  price_paise BIGINT NOT NULL CHECK (price_paise > 0),
  image_path TEXT NOT NULL,
  starts_at TIMESTAMPTZ,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webinars_visible_created
  ON public.webinars (is_visible, created_at DESC);

CREATE TABLE IF NOT EXISTS public.webinar_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  webinar_id UUID NOT NULL REFERENCES public.webinars(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  form_data JSONB NOT NULL DEFAULT '{}',
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webinar_registrations_user
  ON public.webinar_registrations (user_id);
CREATE INDEX IF NOT EXISTS idx_webinar_registrations_webinar
  ON public.webinar_registrations (webinar_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_webinar_registrations_order_unique
  ON public.webinar_registrations (razorpay_order_id)
  WHERE razorpay_order_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_webinar_registrations_payment_unique
  ON public.webinar_registrations (razorpay_payment_id)
  WHERE razorpay_payment_id IS NOT NULL;

ALTER TABLE public.webinars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webinar_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view visible webinars" ON public.webinars;
CREATE POLICY "Public can view visible webinars"
  ON public.webinars FOR SELECT
  TO anon, authenticated
  USING (is_visible = TRUE);

DROP POLICY IF EXISTS "Users can view own webinar registrations" ON public.webinar_registrations;
CREATE POLICY "Users can view own webinar registrations"
  ON public.webinar_registrations FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

REVOKE INSERT, UPDATE, DELETE ON public.webinars FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.webinar_registrations FROM anon, authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'webinar-posters',
  'webinar-posters',
  TRUE,
  5242880,
  ARRAY['image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public can read webinar posters" ON storage.objects;
CREATE POLICY "Public can read webinar posters"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'webinar-posters');
