-- Programs table (seed data)
CREATE TABLE IF NOT EXISTS programs (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  tagline TEXT NOT NULL,
  audience TEXT NOT NULL,
  duration TEXT NOT NULL,
  price_paise BIGINT NOT NULL,
  description TEXT NOT NULL,
  accent TEXT NOT NULL DEFAULT '#9B59D0'
);

INSERT INTO programs (name, tagline, audience, duration, price_paise, description, accent) VALUES
  ('Digital Journey Begins', 'From Beginner to Job & Entrepreneurship Ready', 'Beginner Students & Freshers', '6 Months', 3500000, 'Comprehensive six-month program from zero experience to job readiness.', '#9B59D0'),
  ('One Step to Business', 'Business Scaling with Advanced Marketing & AI', 'Professional Business Owners', 'Flexible', 4999900, 'Advanced program for business owners to scale through digital marketing and AI.', '#FBBF24'),
  ('AI Hero', 'Build. Automate. Scale.', 'Future AI Leaders & Technology Builders', '3 Months', 6000000, 'Intensive AI-focused program with advanced AI knowledge and capstone project.', '#9B59D0');

-- Enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  program_id INTEGER NOT NULL REFERENCES programs(id),
  status TEXT NOT NULL DEFAULT 'pending',
  form_data JSONB NOT NULL DEFAULT '{}',
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_razorpay_order_id ON enrollments(razorpay_order_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_enrollments_razorpay_order_id_unique
  ON enrollments (razorpay_order_id)
  WHERE razorpay_order_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_enrollments_razorpay_payment_id_unique
  ON enrollments (razorpay_payment_id)
  WHERE razorpay_payment_id IS NOT NULL;

-- Webinars are managed separately from the platform course catalog.
CREATE TABLE IF NOT EXISTS webinars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  announcement_text TEXT NOT NULL,
  description TEXT NOT NULL,
  price_paise BIGINT NOT NULL CHECK (price_paise > 0),
  image_path TEXT NOT NULL,
  whatsapp_group_url TEXT,
  starts_at TIMESTAMPTZ,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webinar_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  webinar_id UUID NOT NULL REFERENCES webinars(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'pending',
  form_data JSONB NOT NULL DEFAULT '{}',
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_webinar_registrations_order_unique
  ON webinar_registrations (razorpay_order_id)
  WHERE razorpay_order_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_webinar_registrations_payment_unique
  ON webinar_registrations (razorpay_payment_id)
  WHERE razorpay_payment_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_webinars_only_one_visible
  ON webinars ((is_visible))
  WHERE is_visible = TRUE;
