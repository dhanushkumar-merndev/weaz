BEGIN;

-- Stop safely before changing policies if legacy data would violate the new
-- one-order/one-payment guarantees. Reconcile such rows against Razorpay first.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.enrollments
    WHERE razorpay_order_id IS NOT NULL
    GROUP BY razorpay_order_id
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Duplicate razorpay_order_id values exist. Reconcile them before applying this migration.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.enrollments
    WHERE razorpay_payment_id IS NOT NULL
    GROUP BY razorpay_payment_id
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Duplicate razorpay_payment_id values exist. Reconcile them before applying this migration.';
  END IF;
END
$$;

-- Signed-in browser clients must not be able to create or modify payment state.
DROP POLICY IF EXISTS "enrollments_insert_own" ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_update_own" ON public.enrollments;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.enrollments FROM anon, authenticated;

-- A Razorpay order/payment can fulfill at most one enrollment.
CREATE UNIQUE INDEX IF NOT EXISTS idx_enrollments_razorpay_order_id_unique
  ON public.enrollments (razorpay_order_id)
  WHERE razorpay_order_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_enrollments_razorpay_payment_id_unique
  ON public.enrollments (razorpay_payment_id)
  WHERE razorpay_payment_id IS NOT NULL;

COMMIT;
