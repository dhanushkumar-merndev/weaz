import "server-only";

import type { User } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase";
import { asPositiveInteger, PAYMENT_CURRENCY } from "@/lib/payment-security";
import { getRazorpay, getRazorpayKeyId } from "@/lib/razorpay";
import {
  CONFIRMED_STATUSES,
  REGISTRATION_STATUS,
  type RegistrationType,
  type WebinarAvailability,
} from "@/lib/webinar-slots";

type SupabaseAdmin = ReturnType<typeof getSupabaseAdmin>;

const AVAILABILITY_COLUMNS =
  "id, title, price_paise, starts_at, is_visible, free_registration_enabled, free_slot_limit, free_slots_claimed, free_registration_starts_at, free_registration_ends_at";

/** Never selected by a public endpoint. */
const PRIVATE_COLUMNS = `${AVAILABILITY_COLUMNS}, whatsapp_group_url`;

export interface WebinarRow {
  id: string;
  title: string;
  price_paise: number;
  starts_at: string | null;
  is_visible: boolean;
  free_registration_enabled: boolean;
  free_slot_limit: number;
  free_slots_claimed: number;
  free_registration_starts_at: string | null;
  free_registration_ends_at: string | null;
  whatsapp_group_url?: string | null;
}

export function normalizeName(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

export function normalizePhone(value: unknown) {
  if (typeof value !== "string") return "";
  const digits = value.replace(/\D/g, "");
  return digits.length === 12 && digits.startsWith("91")
    ? digits.slice(2)
    : digits;
}

export function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function buildAvailability(webinar: WebinarRow): WebinarAvailability {
  const now = Date.now();
  const startsAt = webinar.free_registration_starts_at
    ? new Date(webinar.free_registration_starts_at).getTime()
    : null;
  const endsAt = webinar.free_registration_ends_at
    ? new Date(webinar.free_registration_ends_at).getTime()
    : null;

  const limit = Math.max(0, webinar.free_slot_limit ?? 0);
  const claimed = Math.max(0, webinar.free_slots_claimed ?? 0);
  const remaining = Math.max(0, limit - claimed);
  const windowOpen =
    (startsAt === null || now >= startsAt) && (endsAt === null || now < endsAt);
  const available =
    webinar.free_registration_enabled === true && remaining > 0 && windowOpen;

  return {
    webinarId: webinar.id,
    freeRegistrationEnabled: webinar.free_registration_enabled === true,
    freeSlotLimit: limit,
    freeSlotsClaimed: claimed,
    freeSlotsRemaining: remaining,
    freeRegistrationAvailable: available,
    freeRegistrationStartsAt: webinar.free_registration_starts_at,
    freeRegistrationEndsAt: webinar.free_registration_ends_at,
    paymentRequired: !available,
    price: Math.round(webinar.price_paise) / 100,
    pricePaise: webinar.price_paise,
  };
}

export async function loadWebinar(
  supabase: SupabaseAdmin,
  webinarId: string,
  options: { includePrivate?: boolean; requireVisible?: boolean } = {}
) {
  const { includePrivate = false, requireVisible = true } = options;
  let query = supabase
    .from("webinars")
    .select(includePrivate ? PRIVATE_COLUMNS : AVAILABILITY_COLUMNS)
    .eq("id", webinarId)
    .is("deleted_at", null);

  if (requireVisible) query = query.eq("is_visible", true);

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(`Could not load the webinar: ${error.message}`);
  return (data as WebinarRow | null) ?? null;
}

export async function getWebinarAvailability(
  supabase: SupabaseAdmin,
  webinarId: string
) {
  const webinar = await loadWebinar(supabase, webinarId);
  return webinar ? buildAvailability(webinar) : null;
}

export type RegistrationOutcome =
  | {
      kind: "CONFIRMED";
      registrationId: string;
      registrationType: RegistrationType;
      status: "FREE_CONFIRMED" | "PAID_CONFIRMED";
      amountPaise: number;
      privateGroupLink: string | null;
      availability: WebinarAvailability;
    }
  | {
      kind: "PAYMENT_PENDING";
      registrationId: string;
      amountPaise: number;
      availability: WebinarAvailability;
    }
  | {
      kind: "PAYMENT_REQUIRED";
      code: "FREE_SLOTS_EXHAUSTED" | "PAYMENT_REQUIRED";
      message: string;
      availability: WebinarAvailability;
    }
  | {
      kind: "ERROR";
      status: number;
      message: string;
      availability?: WebinarAvailability;
    };

interface RegisterInput {
  supabase: SupabaseAdmin;
  user: User;
  webinarId: string;
  name: string;
  phone: string;
  /**
   * True only when the visitor was already shown a paid call to action and
   * agreed to pay. It never decides the price or whether a slot is free —
   * that is always recalculated from the database.
   */
  acceptPaid: boolean;
}

interface FreeSlotClaimRow {
  result_code: string;
  claimed_registration_id: string | null;
  slot_limit: number;
  slots_claimed: number;
}

export async function registerForWebinar({
  supabase,
  user,
  webinarId,
  name,
  phone,
  acceptPaid,
}: RegisterInput): Promise<RegistrationOutcome> {
  const attendeeName = normalizeName(name);
  const attendeePhone = normalizePhone(phone);
  const attendeeEmail = normalizeEmail(user.email);

  if (
    attendeeName.length < 2 ||
    attendeeName.length > 120 ||
    attendeePhone.length !== 10
  ) {
    return {
      kind: "ERROR",
      status: 400,
      message: "Enter a valid name and 10-digit phone number",
    };
  }
  if (!attendeeEmail) {
    return {
      kind: "ERROR",
      status: 400,
      message: "Your account has no email address",
    };
  }

  const webinar = await loadWebinar(supabase, webinarId, {
    includePrivate: true,
  });
  if (!webinar) {
    return {
      kind: "ERROR",
      status: 404,
      message: "This webinar is not available",
    };
  }

  const formData = {
    name: attendeeName,
    phone: attendeePhone,
    email: attendeeEmail,
  };

  // 1. An existing confirmed registration is returned as-is, which makes the
  //    endpoint idempotent for repeated submissions.
  const existing = await findExistingRegistrations(supabase, webinar.id, {
    userId: user.id,
    email: attendeeEmail,
    phone: attendeePhone,
  });
  if (existing.own) {
    return confirmedOutcome(
      existing.own,
      webinar.whatsapp_group_url ?? null,
      buildAvailability(webinar)
    );
  }
  if (existing.conflicting) return DUPLICATE_CONTACT_ERROR;

  // 2. Try the free slot. The database decides, atomically.
  let availability = buildAvailability(webinar);
  if (availability.freeRegistrationAvailable) {
    const { data, error } = await supabase.rpc("claim_webinar_free_slot", {
      target_webinar_id: webinar.id,
      target_user_id: user.id,
      target_email: attendeeEmail,
      target_phone: attendeePhone,
      target_form_data: formData,
    });

    if (error) {
      // A unique-index violation means a confirmed registration for the same
      // person was written concurrently. The claim transaction rolled back, so
      // no free slot was consumed.
      if (error.code === "23505") {
        const duplicate = await findExistingRegistrations(supabase, webinar.id, {
          userId: user.id,
          email: attendeeEmail,
          phone: attendeePhone,
        });
        if (duplicate.own) {
          return confirmedOutcome(
            duplicate.own,
            webinar.whatsapp_group_url ?? null,
            availability
          );
        }
        if (duplicate.conflicting) return DUPLICATE_CONTACT_ERROR;
      }
      console.error("Free webinar slot claim failed", error.message);
      return {
        kind: "ERROR",
        status: 500,
        message: "Could not complete the free registration",
        availability,
      };
    }

    const claim = (data as FreeSlotClaimRow[] | null)?.[0];
    if (!claim) {
      console.error("Free webinar slot claim returned no result", webinar.id);
      return {
        kind: "ERROR",
        status: 500,
        message: "Could not complete the free registration",
        availability,
      };
    }
    if (claim.result_code === "WEBINAR_NOT_FOUND") {
      return {
        kind: "ERROR",
        status: 404,
        message: "This webinar is not available",
        availability,
      };
    }

    // The claim result carries the authoritative counters after the attempt.
    const stillFree =
      availability.freeRegistrationEnabled &&
      claim.slots_claimed < claim.slot_limit;
    availability = {
      ...availability,
      freeSlotLimit: claim.slot_limit,
      freeSlotsClaimed: claim.slots_claimed,
      freeSlotsRemaining: Math.max(0, claim.slot_limit - claim.slots_claimed),
      freeRegistrationAvailable: stillFree,
      paymentRequired: !stillFree,
    };

    if (
      claim.result_code === "FREE_CONFIRMED" &&
      claim.claimed_registration_id
    ) {
      return {
        kind: "CONFIRMED",
        registrationId: claim.claimed_registration_id,
        registrationType: "FREE",
        status: REGISTRATION_STATUS.freeConfirmed,
        amountPaise: 0,
        privateGroupLink: webinar.whatsapp_group_url ?? null,
        availability,
      };
    }

    if (
      claim.result_code === "ALREADY_REGISTERED" &&
      claim.claimed_registration_id
    ) {
      const claimed = await loadRegistrationById(
        supabase,
        claim.claimed_registration_id
      );
      if (!claimed) {
        return {
          kind: "ERROR",
          status: 500,
          message: "Could not load your existing registration",
          availability,
        };
      }
      const ownsClaimed =
        claimed.user_id === user.id ||
        (attendeeEmail !== "" && claimed.contact_email === attendeeEmail);
      return ownsClaimed
        ? confirmedOutcome(
            claimed,
            webinar.whatsapp_group_url ?? null,
            availability
          )
        : DUPLICATE_CONTACT_ERROR;
    }

    // FREE_SLOTS_EXHAUSTED or FREE_UNAVAILABLE both fall through to payment.
    if (!acceptPaid) {
      return {
        kind: "PAYMENT_REQUIRED",
        code: "FREE_SLOTS_EXHAUSTED",
        message: "The final free slot was just claimed.",
        availability,
      };
    }
  } else if (!acceptPaid) {
    return {
      kind: "PAYMENT_REQUIRED",
      code: availability.freeRegistrationEnabled
        ? "FREE_SLOTS_EXHAUSTED"
        : "PAYMENT_REQUIRED",
      message: availability.freeRegistrationEnabled
        ? "Free registration is now closed. Paid registration is still available."
        : "This webinar requires payment to register.",
      availability,
    };
  }

  // 3. Paid registration. The amount always comes from the webinar record.
  const amountPaise = asPositiveInteger(webinar.price_paise);
  if (!amountPaise) {
    return {
      kind: "ERROR",
      status: 500,
      message: "The webinar has an invalid price",
      availability,
    };
  }

  const pending = await reserveOrReusePendingRegistration({
    supabase,
    userId: user.id,
    webinarId: webinar.id,
    amountPaise,
    email: attendeeEmail,
    phone: attendeePhone,
    formData,
  });
  if (!pending) {
    return {
      kind: "ERROR",
      status: 500,
      message: "Could not prepare the registration",
      availability,
    };
  }

  return {
    kind: "PAYMENT_PENDING",
    registrationId: pending,
    amountPaise,
    availability,
  };
}

interface ConfirmedRegistrationRow {
  id: string;
  status: string;
  amount_paise: number | null;
  registration_type: string;
  user_id: string;
  contact_email: string | null;
}

interface ExistingRegistrations {
  /** A confirmed registration that belongs to the signed-in visitor. */
  own: ConfirmedRegistrationRow | null;
  /** Someone else already used the same mobile number for this webinar. */
  conflicting: ConfirmedRegistrationRow | null;
}

/**
 * Looks up confirmed registrations that match the visitor's account or the
 * contact details they entered. Ownership is checked explicitly so a shared or
 * mistyped phone number can never reveal another attendee's registration.
 */
async function findExistingRegistrations(
  supabase: SupabaseAdmin,
  webinarId: string,
  identity: { userId: string; email: string; phone: string }
): Promise<ExistingRegistrations> {
  const filters = [`user_id.eq."${identity.userId}"`];
  if (identity.email) filters.push(`contact_email.eq."${identity.email}"`);
  if (identity.phone) filters.push(`contact_phone.eq."${identity.phone}"`);

  const { data, error } = await supabase
    .from("webinar_registrations")
    .select("id, status, amount_paise, registration_type, user_id, contact_email")
    .eq("webinar_id", webinarId)
    .in("status", CONFIRMED_STATUSES)
    .or(filters.join(","))
    .order("registered_at", { ascending: true })
    .limit(10);

  if (error) {
    console.error("Confirmed registration lookup failed", error.message);
    return { own: null, conflicting: null };
  }

  const rows = (data ?? []) as ConfirmedRegistrationRow[];
  const isOwn = (row: ConfirmedRegistrationRow) =>
    row.user_id === identity.userId ||
    (identity.email !== "" && row.contact_email === identity.email);

  return {
    own: rows.find(isOwn) ?? null,
    conflicting: rows.find((row) => !isOwn(row)) ?? null,
  };
}

async function loadRegistrationById(
  supabase: SupabaseAdmin,
  registrationId: string
) {
  const { data } = await supabase
    .from("webinar_registrations")
    .select("id, status, amount_paise, registration_type, user_id, contact_email")
    .eq("id", registrationId)
    .maybeSingle();
  return (data as ConfirmedRegistrationRow | null) ?? null;
}

function confirmedOutcome(
  row: ConfirmedRegistrationRow,
  privateGroupLink: string | null,
  availability: WebinarAvailability
): RegistrationOutcome {
  return {
    kind: "CONFIRMED",
    registrationId: row.id,
    registrationType:
      row.status === REGISTRATION_STATUS.freeConfirmed ? "FREE" : "PAID",
    status: row.status as "FREE_CONFIRMED" | "PAID_CONFIRMED",
    amountPaise: row.amount_paise ?? 0,
    privateGroupLink,
    availability,
  };
}

const DUPLICATE_CONTACT_ERROR: RegistrationOutcome = {
  kind: "ERROR",
  status: 409,
  message:
    "This mobile number is already registered for this webinar. Use a different number or sign in with the account that registered.",
};

async function reserveOrReusePendingRegistration({
  supabase,
  userId,
  webinarId,
  amountPaise,
  email,
  phone,
  formData,
}: {
  supabase: SupabaseAdmin;
  userId: string;
  webinarId: string;
  amountPaise: number;
  email: string;
  phone: string;
  formData: Record<string, string>;
}) {
  const { data: pendingRows, error: pendingError } = await supabase
    .from("webinar_registrations")
    .select("id, amount_paise, razorpay_order_id")
    .eq("user_id", userId)
    .eq("webinar_id", webinarId)
    .eq("status", REGISTRATION_STATUS.paymentPending)
    .order("created_at", { ascending: false })
    .limit(100);

  if (pendingError) {
    console.error("Pending registration lookup failed", pendingError.message);
    return null;
  }

  const now = new Date().toISOString();
  const reusable = pendingRows?.find(
    (registration) =>
      registration.amount_paise === amountPaise ||
      (registration.amount_paise === null &&
        registration.razorpay_order_id === null)
  );

  if (reusable) {
    const { data, error } = await supabase
      .from("webinar_registrations")
      .update({
        amount_paise: amountPaise,
        registration_type: "PAID",
        contact_email: email,
        contact_phone: phone,
        form_data: formData,
        updated_at: now,
      })
      .eq("id", reusable.id)
      .eq("user_id", userId)
      .eq("status", REGISTRATION_STATUS.paymentPending)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("Pending registration update failed", error.message);
      return null;
    }
    if (data) return data.id;
  }

  const { data, error } = await supabase
    .from("webinar_registrations")
    .insert({
      user_id: userId,
      webinar_id: webinarId,
      status: REGISTRATION_STATUS.paymentPending,
      registration_type: "PAID",
      amount_paise: amountPaise,
      contact_email: email,
      contact_phone: phone,
      form_data: formData,
      registered_at: now,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Registration creation failed", error.message);
    return null;
  }
  return data.id;
}

/**
 * Returns the private group link only when the signed-in user holds a
 * confirmed registration for the webinar.
 */
export async function getConfirmedAccess(
  supabase: SupabaseAdmin,
  userId: string,
  webinarId: string
) {
  const { data, error } = await supabase
    .from("webinar_registrations")
    .select(
      "id, status, registration_type, amount_paise, paid_at, registered_at, webinars!inner(title, whatsapp_group_url)"
    )
    .eq("user_id", userId)
    .eq("webinar_id", webinarId)
    .in("status", CONFIRMED_STATUSES)
    .order("registered_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const webinar = data.webinars as unknown as {
    title: string;
    whatsapp_group_url: string | null;
  };

  return {
    registrationId: data.id,
    status: data.status,
    registrationType: data.registration_type as RegistrationType,
    amountPaid: (data.amount_paise ?? 0) / 100,
    webinarTitle: webinar.title,
    privateGroupLink: webinar.whatsapp_group_url ?? null,
  };
}

interface PaymentOrderResult {
  ok: boolean;
  status: number;
  body: Record<string, unknown>;
}

function orderMatches(
  order: { amount: number | string; currency: string; receipt?: string },
  registrationId: string,
  amount: number
) {
  return (
    order.receipt === registrationId &&
    asPositiveInteger(order.amount) === amount &&
    order.currency === PAYMENT_CURRENCY
  );
}

/**
 * Creates (or safely reuses) the Razorpay order for a pending registration.
 * The amount is always taken from the server-stored registration.
 */
export async function createWebinarPaymentOrder({
  supabase,
  userId,
  registrationId,
}: {
  supabase: SupabaseAdmin;
  userId: string;
  registrationId: string;
}): Promise<PaymentOrderResult> {
  const { data: registration, error } = await supabase
    .from("webinar_registrations")
    .select(
      "id, status, amount_paise, razorpay_order_id, webinar_id, webinars!inner(price_paise)"
    )
    .eq("id", registrationId)
    .eq("user_id", userId)
    .single();

  if (error || !registration) {
    return {
      ok: false,
      status: 404,
      body: { error: "Registration not found" },
    };
  }
  if (registration.status === REGISTRATION_STATUS.freeConfirmed) {
    return {
      ok: false,
      status: 409,
      body: { error: "This registration is already confirmed for free" },
    };
  }
  if (registration.status !== REGISTRATION_STATUS.paymentPending) {
    return {
      ok: false,
      status: 409,
      body: { error: "This registration is not awaiting payment" },
    };
  }

  let amount = asPositiveInteger(
    registration.amount_paise ??
      (registration.webinars as unknown as { price_paise: number }).price_paise
  );
  if (!amount) {
    return {
      ok: false,
      status: 500,
      body: { error: "The webinar has an invalid price" },
    };
  }

  const razorpay = getRazorpay();
  if (registration.razorpay_order_id) {
    const order = await razorpay.orders.fetch(registration.razorpay_order_id);
    const legacyOrderAmount = asPositiveInteger(order.amount);
    if (registration.amount_paise === null && legacyOrderAmount) {
      amount = legacyOrderAmount;
      const { error: snapshotError } = await supabase
        .from("webinar_registrations")
        .update({
          amount_paise: legacyOrderAmount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", registration.id)
        .eq("user_id", userId)
        .eq("status", REGISTRATION_STATUS.paymentPending)
        .is("amount_paise", null);
      if (snapshotError) {
        return {
          ok: false,
          status: 500,
          body: { error: "Could not save the original order amount" },
        };
      }
    }
    if (!orderMatches(order, registration.id, amount)) {
      return {
        ok: false,
        status: 409,
        body: { error: "Stored payment order is invalid" },
      };
    }
    if (order.status === "paid") {
      return {
        ok: false,
        status: 409,
        body: { error: "This payment is being reconciled" },
      };
    }
    return {
      ok: true,
      status: 200,
      body: {
        order_id: order.id,
        registration_id: registration.id,
        amount,
        currency: PAYMENT_CURRENCY,
        key_id: getRazorpayKeyId(),
      },
    };
  }

  const matching = await razorpay.orders.all({
    receipt: registration.id,
    count: 100,
  });
  const reusable = matching.items
    .filter(
      (order) =>
        order.status !== "paid" && orderMatches(order, registration.id, amount)
    )
    .sort((a, b) => b.created_at - a.created_at)[0];
  const order =
    reusable ??
    (await razorpay.orders.create({
      amount,
      currency: PAYMENT_CURRENCY,
      receipt: registration.id,
      partial_payment: false,
      notes: {
        user_id: userId,
        webinar_registration_id: registration.id,
      },
    }));

  const { data: attached, error: updateError } = await supabase
    .from("webinar_registrations")
    .update({
      amount_paise: amount,
      razorpay_order_id: order.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", registration.id)
    .eq("user_id", userId)
    .eq("status", REGISTRATION_STATUS.paymentPending)
    .is("razorpay_order_id", null)
    .select("razorpay_order_id")
    .maybeSingle();

  if (updateError) {
    return {
      ok: false,
      status: 500,
      body: { error: "Could not save payment order" },
    };
  }

  if (!attached) {
    const { data: concurrent } = await supabase
      .from("webinar_registrations")
      .select("razorpay_order_id, status")
      .eq("id", registration.id)
      .eq("user_id", userId)
      .single();
    if (
      concurrent?.status !== REGISTRATION_STATUS.paymentPending ||
      !concurrent.razorpay_order_id
    ) {
      return {
        ok: false,
        status: 409,
        body: { error: "Payment order conflict" },
      };
    }
    const stored = await razorpay.orders.fetch(concurrent.razorpay_order_id);
    if (!orderMatches(stored, registration.id, amount)) {
      return {
        ok: false,
        status: 409,
        body: { error: "Stored payment order is invalid" },
      };
    }
    return {
      ok: true,
      status: 200,
      body: {
        order_id: stored.id,
        registration_id: registration.id,
        amount,
        currency: PAYMENT_CURRENCY,
        key_id: getRazorpayKeyId(),
      },
    };
  }

  return {
    ok: true,
    status: 200,
    body: {
      order_id: order.id,
      registration_id: registration.id,
      amount,
      currency: PAYMENT_CURRENCY,
      key_id: getRazorpayKeyId(),
    },
  };
}
