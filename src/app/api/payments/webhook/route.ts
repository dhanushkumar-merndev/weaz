import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  asPositiveInteger,
  isRazorpayOrderId,
  isRazorpayPaymentId,
  PAYMENT_CURRENCY,
  verifyHmacSha256,
} from "@/lib/payment-security";
import { REGISTRATION_STATUS } from "@/lib/webinar-slots";

export const runtime = "nodejs";

type CapturedPayment = {
  id?: unknown;
  order_id?: unknown;
  amount?: unknown;
  currency?: unknown;
  status?: unknown;
  captured?: unknown;
};

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function getWebhookSecret() {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!secret) {
    throw new Error(
      "Missing required environment variable: RAZORPAY_WEBHOOK_SECRET"
    );
  }
  return secret;
}

function getCapturedPayment(payload: unknown): CapturedPayment | null {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("payload" in payload) ||
    typeof payload.payload !== "object" ||
    payload.payload === null ||
    !("payment" in payload.payload) ||
    typeof payload.payload.payment !== "object" ||
    payload.payload.payment === null ||
    !("entity" in payload.payload.payment) ||
    typeof payload.payload.payment.entity !== "object" ||
    payload.payload.payment.entity === null
  ) {
    return null;
  }

  return payload.payload.payment.entity as CapturedPayment;
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");
    const eventId = request.headers.get("x-razorpay-event-id");

    if (!signature) {
      return errorResponse("Missing signature", 400);
    }

    // The raw request body must be used exactly as received.
    if (!verifyHmacSha256(rawBody, signature, getWebhookSecret())) {
      return errorResponse("Invalid signature", 400);
    }

    let payload: unknown;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return errorResponse("Invalid webhook payload", 400);
    }

    if (
      typeof payload !== "object" ||
      payload === null ||
      !("event" in payload) ||
      typeof payload.event !== "string"
    ) {
      return errorResponse("Invalid webhook payload", 400);
    }

    if (payload.event !== "payment.captured") {
      return NextResponse.json({ received: true });
    }

    const payment = getCapturedPayment(payload);
    if (
      !payment ||
      !isRazorpayPaymentId(payment.id) ||
      !isRazorpayOrderId(payment.order_id) ||
      payment.status !== "captured" ||
      payment.captured !== true ||
      payment.currency !== PAYMENT_CURRENCY
    ) {
      return errorResponse("Invalid captured payment payload", 400);
    }

    const amount =
      typeof payment.amount === "string" ||
      typeof payment.amount === "number"
        ? asPositiveInteger(payment.amount)
        : null;
    if (!amount) {
      return errorResponse("Invalid payment amount", 400);
    }

    const supabase = getSupabaseAdmin();
    const { data: enrollment, error: enrollmentError } = await supabase
      .from("enrollments")
      .select("id, status, razorpay_payment_id, programs!inner(price_paise)")
      .eq("razorpay_order_id", payment.order_id)
      .maybeSingle();

    if (enrollmentError || !enrollment) {
      const { data: registration, error: registrationError } = await supabase
        .from("webinar_registrations")
        .select("id, status, amount_paise, razorpay_payment_id")
        .eq("razorpay_order_id", payment.order_id)
        .maybeSingle();

      if (registrationError || !registration) {
        console.error("Webhook order has no matching purchase", {
          eventId,
          orderId: payment.order_id,
          paymentId: payment.id,
        });
        // Non-2xx tells Razorpay to retry while an order/database race resolves.
        return errorResponse("Payment order not found", 404);
      }

      const expectedWebinarAmount = asPositiveInteger(
        registration.amount_paise ?? amount
      );
      if (!expectedWebinarAmount || expectedWebinarAmount !== amount) {
        console.error("Webhook amount does not match webinar registration", {
          eventId,
          registrationId: registration.id,
          orderId: payment.order_id,
          paymentId: payment.id,
        });
        return errorResponse("Payment amount mismatch", 409);
      }

      if (registration.status === REGISTRATION_STATUS.paidConfirmed) {
        return registration.razorpay_payment_id === payment.id
          ? NextResponse.json({ received: true })
          : errorResponse("Registration is linked to another payment", 409);
      }
      if (
        registration.status === REGISTRATION_STATUS.freeConfirmed ||
        registration.status === REGISTRATION_STATUS.cancelled
      ) {
        // Terminal state. Retrying cannot change it, so acknowledge the event
        // and leave the payment for manual reconciliation.
        console.error("Captured payment for a non-payable webinar registration", {
          eventId,
          registrationId: registration.id,
          status: registration.status,
          paymentId: payment.id,
        });
        return NextResponse.json({ received: true });
      }
      if (registration.status !== REGISTRATION_STATUS.paymentPending) {
        return errorResponse("Registration is not awaiting payment", 409);
      }

      const now = new Date().toISOString();
      const { data: updated, error: updateError } = await supabase
        .from("webinar_registrations")
        .update({
          status: REGISTRATION_STATUS.paidConfirmed,
          registration_type: "PAID",
          amount_paise: expectedWebinarAmount,
          razorpay_payment_id: payment.id,
          paid_at: now,
          updated_at: now,
        })
        .eq("id", registration.id)
        .eq("status", REGISTRATION_STATUS.paymentPending)
        .is("razorpay_payment_id", null)
        .select("id")
        .maybeSingle();

      if (updateError) {
        console.error("Webhook could not mark webinar registration as paid", {
          eventId,
          registrationId: registration.id,
          paymentId: payment.id,
          error: updateError.message,
        });
        // A duplicate confirmed registration cannot be resolved by a retry.
        return updateError.code === "23505"
          ? NextResponse.json({ received: true })
          : errorResponse("Could not save payment confirmation", 500);
      }

      if (!updated) {
        const { data: reconciled } = await supabase
          .from("webinar_registrations")
          .select("status, razorpay_payment_id")
          .eq("id", registration.id)
          .single();
        if (
          reconciled?.status !== REGISTRATION_STATUS.paidConfirmed ||
          reconciled.razorpay_payment_id !== payment.id
        ) {
          return errorResponse("Payment confirmation conflict", 409);
        }
      }

      return NextResponse.json({ received: true });
    }

    const expectedAmount = asPositiveInteger(
      (enrollment.programs as { price_paise: number }).price_paise
    );
    if (!expectedAmount || expectedAmount !== amount) {
      console.error("Webhook amount does not match enrollment", {
        eventId,
        enrollmentId: enrollment.id,
        orderId: payment.order_id,
        paymentId: payment.id,
      });
      return errorResponse("Payment amount mismatch", 409);
    }

    // This makes duplicate delivery idempotent without changing paid_at.
    if (enrollment.status === "paid") {
      if (enrollment.razorpay_payment_id !== payment.id) {
        console.error("Enrollment is linked to a different payment", {
          eventId,
          enrollmentId: enrollment.id,
          paymentId: payment.id,
        });
        return errorResponse("Enrollment is linked to another payment", 409);
      }
      return NextResponse.json({ received: true });
    }

    if (enrollment.status !== "pending") {
      return errorResponse("Enrollment is not awaiting payment", 409);
    }

    const now = new Date().toISOString();
    const { data: updatedEnrollment, error: updateError } = await supabase
      .from("enrollments")
      .update({
        status: "paid",
        razorpay_payment_id: payment.id,
        paid_at: now,
        updated_at: now,
      })
      .eq("id", enrollment.id)
      .eq("status", "pending")
      .is("razorpay_payment_id", null)
      .select("id")
      .maybeSingle();

    if (updateError) {
      console.error("Webhook could not mark enrollment as paid", {
        eventId,
        enrollmentId: enrollment.id,
        paymentId: payment.id,
        error: updateError.message,
      });
      return errorResponse("Could not save payment confirmation", 500);
    }

    if (!updatedEnrollment) {
      const { data: reconciled } = await supabase
        .from("enrollments")
        .select("status, razorpay_payment_id")
        .eq("id", enrollment.id)
        .single();

      if (
        reconciled?.status !== "paid" ||
        reconciled.razorpay_payment_id !== payment.id
      ) {
        return errorResponse("Payment confirmation conflict", 409);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Razorpay webhook processing failed", error);
    return errorResponse("Webhook processing failed", 500);
  }
}
