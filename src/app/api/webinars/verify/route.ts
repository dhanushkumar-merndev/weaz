import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase/api";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getRazorpay, getRazorpayKeySecret } from "@/lib/razorpay";
import {
  asPositiveInteger,
  isRazorpayOrderId,
  isRazorpayPaymentId,
  isSha256Signature,
  isTrustedBrowserRequest,
  PAYMENT_CURRENCY,
  verifyHmacSha256,
} from "@/lib/payment-security";
import { REGISTRATION_STATUS } from "@/lib/webinar-slots";

export const runtime = "nodejs";

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  try {
    if (!isTrustedBrowserRequest(request)) {
      return errorResponse("Cross-site request rejected", 403);
    }
    const user = await getUserFromRequest(request);
    if (!user) return errorResponse("Unauthorized", 401);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON body", 400);
    }
    if (typeof body !== "object" || body === null) {
      return errorResponse("Missing payment details", 400);
    }

    const orderId = "razorpay_order_id" in body ? body.razorpay_order_id : null;
    const paymentId =
      "razorpay_payment_id" in body ? body.razorpay_payment_id : null;
    const signature =
      "razorpay_signature" in body ? body.razorpay_signature : null;
    if (
      !isRazorpayOrderId(orderId) ||
      !isRazorpayPaymentId(paymentId) ||
      !isSha256Signature(signature)
    ) {
      return errorResponse("Invalid payment details", 400);
    }

    const supabase = getSupabaseAdmin();
    const { data: registration, error } = await supabase
      .from("webinar_registrations")
      .select(
        "id, status, amount_paise, razorpay_order_id, razorpay_payment_id"
      )
      .eq("razorpay_order_id", orderId)
      .eq("user_id", user.id)
      .single();
    if (error || !registration?.razorpay_order_id) {
      return errorResponse("Payment order not found", 404);
    }

    const storedOrderId = registration.razorpay_order_id;
    if (
      storedOrderId !== orderId ||
      !verifyHmacSha256(
        `${storedOrderId}|${paymentId}`,
        signature,
        getRazorpayKeySecret()
      )
    ) {
      return errorResponse("Invalid payment signature", 400);
    }

    if (registration.status === REGISTRATION_STATUS.paidConfirmed) {
      return registration.razorpay_payment_id === paymentId
        ? NextResponse.json({
            success: true,
            status: REGISTRATION_STATUS.paidConfirmed,
            registrationType: "PAID",
          })
        : errorResponse("Registration is linked to another payment", 409);
    }
    if (registration.status !== REGISTRATION_STATUS.paymentPending) {
      return errorResponse("Registration is not awaiting payment", 409);
    }

    const razorpay = getRazorpay();
    const [payment, order] = await Promise.all([
      razorpay.payments.fetch(paymentId),
      razorpay.orders.fetch(storedOrderId),
    ]);
    const expectedAmount = asPositiveInteger(
      registration.amount_paise ?? order.amount
    );

    if (
      !expectedAmount ||
      payment.id !== paymentId ||
      payment.order_id !== storedOrderId ||
      asPositiveInteger(payment.amount) !== expectedAmount ||
      payment.currency !== PAYMENT_CURRENCY ||
      order.id !== storedOrderId ||
      order.receipt !== registration.id ||
      asPositiveInteger(order.amount) !== expectedAmount ||
      order.currency !== PAYMENT_CURRENCY
    ) {
      return errorResponse("Payment does not match the registration", 409);
    }

    if (
      payment.status !== "captured" ||
      !payment.captured ||
      order.status !== "paid"
    ) {
      if (
        payment.status === "authorized" ||
        (payment.status === "captured" && order.status !== "paid")
      ) {
        return NextResponse.json(
          { success: false, status: "processing" },
          { status: 202 }
        );
      }
      return errorResponse("Payment has not been captured", 409);
    }

    const now = new Date().toISOString();
    const { data: updated, error: updateError } = await supabase
      .from("webinar_registrations")
      .update({
        status: REGISTRATION_STATUS.paidConfirmed,
        registration_type: "PAID",
        amount_paise: expectedAmount,
        razorpay_payment_id: paymentId,
        paid_at: now,
        updated_at: now,
      })
      .eq("id", registration.id)
      .eq("status", REGISTRATION_STATUS.paymentPending)
      .is("razorpay_payment_id", null)
      .select("id")
      .maybeSingle();

    if (updateError) {
      // A unique-index violation means the same person already holds a
      // confirmed registration for this webinar; the payment needs a manual
      // refund rather than a second enrolment.
      if (updateError.code === "23505") {
        console.error("Duplicate confirmed webinar registration on payment", {
          registrationId: registration.id,
          paymentId,
        });
        return errorResponse(
          "You already hold a confirmed registration for this webinar. Contact support to refund this payment.",
          409
        );
      }
      return errorResponse("Could not save payment", 500);
    }

    if (!updated) {
      const { data: reconciled } = await supabase
        .from("webinar_registrations")
        .select("status, razorpay_payment_id")
        .eq("id", registration.id)
        .single();
      if (
        reconciled?.status !== REGISTRATION_STATUS.paidConfirmed ||
        reconciled.razorpay_payment_id !== paymentId
      ) {
        return errorResponse("Payment confirmation conflict", 409);
      }
    }

    return NextResponse.json({
      success: true,
      status: REGISTRATION_STATUS.paidConfirmed,
      registrationType: "PAID",
    });
  } catch (error) {
    console.error("Webinar payment verification failed", error);
    return errorResponse("Unable to verify payment", 502);
  }
}
