# Webinar free registration slots — handoff

Free registration slots, payment fallback and the race-safe allocation are
implemented in the application. **The database migration has not been applied**
because this workspace has no Supabase project access. The feature does not
work — and the site will break on webinar registration — until the migration
below is applied.

## 1. Apply the migration first

```text
supabase/migrations/20260803120000_webinar_free_registration.sql
```

```bash
pnpm exec supabase db push
```

The migration is wrapped in a single transaction and:

- adds `free_registration_enabled`, `free_slot_limit`, `free_slots_claimed`,
  `free_registration_starts_at` and `free_registration_ends_at` to `webinars`,
  with `CHECK (free_slots_claimed <= free_slot_limit)` so the limit can never be
  lowered below the slots already handed out;
- replaces the browser's table-wide `SELECT` grant on `webinars` with an
  explicit safe column list, so `whatsapp_group_url` is no longer readable
  through the public anon or authenticated Supabase key;
- rewrites `webinar_registrations.status` from `pending`/`paid` to
  `FREE_CONFIRMED`, `PAYMENT_PENDING`, `PAID_CONFIRMED`, `PAYMENT_FAILED` and
  `CANCELLED`, and adds `registration_type`, `contact_email`, `contact_phone`
  and `registered_at`;
- adds partial unique indexes on `(webinar_id, contact_email)` and
  `(webinar_id, contact_phone)` for confirmed registrations only, so a failed
  checkout can still be retried;
- creates `claim_webinar_free_slot(...)`, which allocates a slot with one
  conditional `UPDATE ... WHERE free_slots_claimed < free_slot_limit` and writes
  the registration row in the same transaction;
- extends `get_webinar_registration_counts()` with free, pending, failed and
  cancelled counts; and
- creates `admin_audit_log`.

**The application code and the migration must ship together.** The new code
writes the new status values, and the old code reads `pending`/`paid`.

### Pre-existing duplicate contacts

If two confirmed registrations for one webinar already share an email or phone
number, the migration keeps the oldest one authoritative and clears
`contact_email` / `contact_phone` on the newer rows. Nothing is deleted — the
original values remain in `form_data`. Check afterwards with:

```sql
SELECT webinar_id, status, form_data->>'email' AS form_email
FROM webinar_registrations
WHERE contact_email IS NULL
  AND status IN ('FREE_CONFIRMED', 'PAID_CONFIRMED');
```

## 2. Verify after applying

```sql
-- Free-slot settings exist and the guard is in place.
SELECT free_registration_enabled, free_slot_limit, free_slots_claimed
FROM webinars WHERE is_visible = TRUE;

-- The private group link is not readable by the browser roles.
SELECT has_column_privilege('anon', 'public.webinars', 'whatsapp_group_url', 'SELECT')
  AS anon_can_read_group_link;  -- must be false

-- Only the new statuses exist.
SELECT status, COUNT(*) FROM webinar_registrations GROUP BY status;
```

## 3. How free allocation works

1. `POST /api/webinars/:id/register` loads the webinar and recomputes
   availability from the database.
2. If a free slot looks available, it calls `claim_webinar_free_slot(...)`.
3. That function runs one conditional `UPDATE` guarded by
   `free_slots_claimed < free_slot_limit` and inserts the `FREE_CONFIRMED`
   registration in the same transaction. Postgres serializes the row write, so
   only one of two simultaneous requests can take the final slot.
4. The losing request receives:

   ```json
   {
     "success": false,
     "code": "FREE_SLOTS_EXHAUSTED",
     "message": "The final free slot was just claimed.",
     "paymentRequired": true
   }
   ```

   The browser keeps the entered form data and shows the payment fallback
   dialog. "Continue with payment" resubmits with `accept_paid: true`, which is
   consent to pay only — the server still recalculates the price and free
   eligibility.

No cache, browser value, server memory or Redis participates in allocation.

## 4. Endpoints

| Endpoint | Purpose |
| --- | --- |
| `GET /api/webinars/:id/availability` | Live slot counts, never cached |
| `POST /api/webinars/:id/register` | Free claim or pending paid registration |
| `POST /api/webinars/:id/create-payment` | Razorpay order for a pending row |
| `POST /api/webinars/verify` | Checkout signature verification |
| `POST /api/payments/webhook` | `payment.captured` confirmation |
| `PATCH /api/admin/webinars/:id` | Free-slot settings, audit logged |

`POST /api/webinars/register` and `POST /api/webinars/create-order` remain as
thin compatibility wrappers for browser tabs still running the previous bundle.
They share the same server logic and treat the request as paid consent, which is
what that bundle always intended. Remove them once no old tabs remain.

## 5. Not implemented — needs a decision

- **Confirmation email / WhatsApp message (spec §8).** This repository has no
  email or WhatsApp sending integration of any kind, so the private group link
  is shown on the success screen and through `GET /api/webinars/access` only.
  Wiring an outbound provider (Resend, SES, WhatsApp Cloud API) is a separate
  piece of work.
- **Speaker information (spec §13).** There is no speaker field on `webinars`.
  The registration popup shows a host line derived from the existing brand copy.
  Add a `speaker_name` / `speaker_bio` column if per-webinar speaker details are
  wanted.
- **Public webinar listing card (spec §12).** The site has no public webinar
  list page; the promo modal is the only card surface and it carries the badge.

## 6. Test checklist before going live

1. Admin enables free registration with a limit of 2, saves, and the public
   announcement shows the free message with the live remaining count.
2. Two registrations complete free and reach `FREE_CONFIRMED`; the third is
   asked to pay.
3. Fire two simultaneous registrations at the final slot (two browsers or two
   `curl` calls). Exactly one gets `FREE_CONFIRMED`; the other gets
   `FREE_SLOTS_EXHAUSTED` and keeps its form data.
4. The losing request's "Continue with payment" completes a Razorpay checkout
   and reaches `PAID_CONFIRMED`.
5. The private group link is absent from every response until a registration is
   confirmed.
6. Admin lowering the free-slot limit below the claimed count is rejected with a
   clear message.
7. `admin_audit_log` records the create, update, free-settings and remove
   actions.
8. The announcement marquee loops smoothly, pauses on hover and shows static
   text under `prefers-reduced-motion`.
9. The whole flow works on a phone and on desktop.
