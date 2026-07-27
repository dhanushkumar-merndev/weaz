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
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON body", 400);
    }

    if (typeof body !== "object" || body === null) {
      return errorResponse("Missing payment details", 400);
    }

    const orderId =
      "razorpay_order_id" in body ? body.razorpay_order_id : null;
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
    const { data: enrollment, error: enrollmentError } = await supabase
      .from("enrollments")
      .select(
        "id, status, razorpay_order_id, razorpay_payment_id, programs!inner(price_paise)"
      )
      .eq("razorpay_order_id", orderId)
      .eq("user_id", user.id)
      .single();

    if (enrollmentError || !enrollment?.razorpay_order_id) {
      return errorResponse("Payment order not found", 404);
    }

    // Razorpay requires the order id retrieved from the server, rather than
    // trusting the copy returned by Checkout, when constructing this HMAC.
    const storedOrderId = enrollment.razorpay_order_id;
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

    if (enrollment.status === "paid") {
      if (enrollment.razorpay_payment_id === paymentId) {
        return NextResponse.json(
          { success: true },
          { headers: { "Cache-Control": "no-store" } }
        );
      }
      return errorResponse(
        "Enrollment is already linked to another payment",
        409
      );
    }

    if (enrollment.status !== "pending") {
      return errorResponse("Enrollment is not awaiting payment", 409);
    }

    const razorpay = getRazorpay();
    const [payment, order] = await Promise.all([
      razorpay.payments.fetch(paymentId),
      razorpay.orders.fetch(storedOrderId),
    ]);
    const expectedAmount = asPositiveInteger(
      (enrollment.programs as { price_paise: number }).price_paise
    );

    if (
      !expectedAmount ||
      payment.id !== paymentId ||
      payment.order_id !== storedOrderId ||
      asPositiveInteger(payment.amount) !== expectedAmount ||
      payment.currency !== PAYMENT_CURRENCY ||
      order.id !== storedOrderId ||
      order.receipt !== enrollment.id ||
      asPositiveInteger(order.amount) !== expectedAmount ||
      order.currency !== PAYMENT_CURRENCY
    ) {
      console.error("Razorpay payment does not match enrollment", {
        enrollmentId: enrollment.id,
        orderId: storedOrderId,
        paymentId,
      });
      return errorResponse("Payment details do not match the enrollment", 409);
    }

    // An authorised payment is not settled and may be automatically refunded.
    // Fulfil only after Razorpay reports both sides as fully paid/captured.
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
          {
            success: false,
            status: "processing",
            message: "Payment is awaiting final capture confirmation",
          },
          { status: 202, headers: { "Cache-Control": "no-store" } }
        );
      }
      return errorResponse("Payment has not been captured", 409);
    }

    const now = new Date().toISOString();
    const { data: updatedEnrollment, error: updateError } = await supabase
      .from("enrollments")
      .update({
        status: "paid",
        razorpay_payment_id: paymentId,
        paid_at: now,
        updated_at: now,
      })
      .eq("id", enrollment.id)
      .eq("status", "pending")
      .is("razorpay_payment_id", null)
      .select("id")
      .maybeSingle();

    if (updateError) {
      console.error("Could not mark enrollment as paid", {
        enrollmentId: enrollment.id,
        paymentId,
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
        reconciled.razorpay_payment_id !== paymentId
      ) {
        return errorResponse("Payment confirmation conflict", 409);
      }
    }

    return NextResponse.json(
      { success: true },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Razorpay payment verification failed", error);
    return errorResponse("Unable to verify payment", 502);
  }
}
