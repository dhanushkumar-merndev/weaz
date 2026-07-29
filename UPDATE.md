# Production Payment Handoff

## Current status

The Razorpay application flow has been hardened in this commit. The database
migration has intentionally **not** been applied because this workspace has no
Supabase project access. The application must not accept live payments until
the migration and dashboard steps below are complete.

No live or test Razorpay transaction was performed because credentials are not
available in this workspace.

## What changed

- Razorpay orders are always priced from the server-side `programs` record.
- Checkout now receives the same server-side key ID used to create the order.
- Existing pending enrollments and orders are reused across retries.
- Concurrent order creation uses a conditional database update; only the
  server-stored order is returned to Checkout.
- Orphaned Razorpay orders are recovered by the stable enrollment receipt.
- Checkout signatures use a timing-safe comparison and the order ID stored by
  the server.
- Payment verification fetches both Razorpay payment and order records and
  checks order ID, receipt, amount, currency, `captured`, and `paid` state.
- Authorised-but-not-captured payments show a processing state and do not grant
  enrollment.
- The `payment.captured` webhook validates the raw body, payload shape, amount,
  currency, order, and payment IDs.
- Webhook retries are idempotent: duplicate delivery does not change `paid_at`.
- Database errors now return non-2xx responses so Razorpay can retry webhooks.
- Payment and enrollment request bodies have server-side validation.
- Authenticated payment/enrollment POST routes reject cross-site browser calls.
- The contact and WhatsApp number is now `+91 97429 33197`.
- The hero entrance sequence now uses hydration-safe Framer Motion variants,
  preventing the hard-refresh visible/hidden/double-animation flash.
- Navbar enrollment buttons are more compact on desktop and mobile.

## Mandatory deployment order

### 1. Back up and inspect existing payment identifiers

In the Supabase SQL Editor, run these read-only checks:

```sql
SELECT razorpay_order_id, COUNT(*) AS row_count
FROM enrollments
WHERE razorpay_order_id IS NOT NULL
GROUP BY razorpay_order_id
HAVING COUNT(*) > 1;

SELECT razorpay_payment_id, COUNT(*) AS row_count
FROM enrollments
WHERE razorpay_payment_id IS NOT NULL
GROUP BY razorpay_payment_id
HAVING COUNT(*) > 1;
```

Both queries should return zero rows. If either returns rows, compare every row
with the Razorpay dashboard/API and decide which enrollment owns the identifier.
Do not delete or rewrite payment history automatically.

### 2. Apply the migration

Apply:

```text
supabase/migrations/20260727150000_harden_payments.sql
```

Use either the Supabase SQL Editor or the project's normal migration command:

```bash
pnpm exec supabase db push
```

The migration is transactional and intentionally aborts before changing
policies if duplicate Razorpay order or payment IDs exist. It:

- removes browser INSERT and UPDATE policies from `enrollments`;
- revokes browser INSERT, UPDATE, and DELETE privileges; and
- makes non-null Razorpay order IDs and payment IDs unique.

The service-role server routes continue to create and update enrollments.

### 3. Verify database security

Run:

```sql
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'enrollments';

SELECT
  has_table_privilege('anon', 'public.enrollments', 'INSERT') AS anon_insert,
  has_table_privilege('authenticated', 'public.enrollments', 'INSERT') AS authenticated_insert,
  has_table_privilege('authenticated', 'public.enrollments', 'UPDATE') AS authenticated_update;
```

Only the own-row SELECT policy should remain. All three privilege results should
be `false`.

### 4. Configure deployment variables

Set all values from `.env.example` in the deployment platform:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`

`RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` must come from the same Razorpay
mode. Do not mix test and live credentials. The old
`NEXT_PUBLIC_RAZORPAY_KEY_ID` variable is no longer used and can be removed.
Never expose the API key secret, webhook secret, or Supabase service-role key to
browser code.

### 5. Configure Razorpay

In both Razorpay Test Mode and Live Mode:

1. Enable automatic payment capture.
2. Create a webhook for:

   ```text
   POST https://YOUR_DOMAIN/api/payments/webhook
   ```

3. Subscribe to `payment.captured`.
4. Use a strong, separate webhook secret and set the same value as
   `RAZORPAY_WEBHOOK_SECRET` in that environment.
5. Confirm the webhook shows successful 2xx deliveries.

Test and live modes have separate keys and webhook configuration. Configure
both independently.

### 6. Deploy only after the migration

The migration closes the direct Supabase payment-status bypass. Deploying the
code without that migration leaves the old database policy exploitable.

## Required test-mode checks

Perform these before switching to live keys:

1. Successful payment:
   - exactly one Razorpay order is created;
   - payment reaches `captured`;
   - order reaches `paid`;
   - exactly one enrollment becomes `paid`; and
   - stored amount and currency match the program and `INR`.
2. Failed payment leaves the enrollment `pending`.
3. Dismissing and reopening Checkout reuses the same pending order.
4. Replaying the same webhook returns 2xx without changing `paid_at`.
5. A webhook with a modified body or signature returns 400.
6. A signed-in browser cannot directly insert or update `enrollments`.
7. A test/live key mismatch fails without marking an enrollment paid.
8. Temporarily force a database error and confirm the webhook returns non-2xx,
   then succeeds when Razorpay retries after recovery.

## Operations

- Add platform-level rate limits to `/api/leads/submit`,
  `/api/payments/create-order`, and `/api/payments/verify`.
- Alert on 4xx/5xx webhook responses and on log messages containing payment
  mismatch, confirmation conflict, or missing enrollment.
- Reconcile Razorpay captured payments against paid enrollments daily.
- Rotate secrets immediately if any server secret has ever been exposed.
- Never grant authenticated clients INSERT or UPDATE access to payment fields.

## Validation completed in this workspace

- Targeted payment files pass ESLint.
- The project passes `tsc --noEmit`.
- The production Next.js build passes with placeholder environment variables
  using the webpack builder.
- A real transaction and webhook delivery remain mandatory because they require
  the actual Supabase and Razorpay test environments.

Repository-wide `pnpm lint` still reports pre-existing issues outside the
payment implementation (primarily the admin UI, animation component, React
effect rules, and the UTF-16 generated `database.types.ts`). The payment files
listed above are clean, and these unrelated lint issues do not block the
production build, but they should be handled before making full-project lint a
required CI check.
