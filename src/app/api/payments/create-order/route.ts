import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase/api";
import { getRazorpay, getRazorpayKeyId } from "@/lib/razorpay";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  asPositiveInteger,
  isEnrollmentId,
  isTrustedBrowserRequest,
  PAYMENT_CURRENCY,
} from "@/lib/payment-security";

export const runtime = "nodejs";

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

function orderMatchesEnrollment(
  order: {
    amount: number | string;
    currency: string;
    receipt?: string;
  },
  enrollmentId: string,
  amount: number
) {
  return (
    order.receipt === enrollmentId &&
    asPositiveInteger(order.amount) === amount &&
    order.currency === PAYMENT_CURRENCY
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

    const enrollmentId =
      typeof body === "object" &&
      body !== null &&
      "enrollment_id" in body
        ? body.enrollment_id
        : null;

    if (!isEnrollmentId(enrollmentId)) {
      return errorResponse("Invalid enrollment_id", 400);
    }

    const supabase = getSupabaseAdmin();
    const { data: enrollment, error: enrollmentError } = await supabase
      .from("enrollments")
      .select("id, status, razorpay_order_id, programs!inner(price_paise)")
      .eq("id", enrollmentId)
      .eq("user_id", user.id)
      .single();

    if (enrollmentError || !enrollment) {
      return errorResponse("Enrollment not found", 404);
    }

    if (enrollment.status !== "pending") {
      return errorResponse("This enrollment is not awaiting payment", 409);
    }

    const amount = asPositiveInteger(
      (enrollment.programs as { price_paise: number }).price_paise
    );
    if (!amount) {
      console.error("Program has invalid Razorpay amount", {
        enrollmentId: enrollment.id,
      });
      return errorResponse("The selected program has an invalid price", 500);
    }

    const razorpay = getRazorpay();

    if (enrollment.razorpay_order_id) {
      const existingOrder = await razorpay.orders.fetch(
        enrollment.razorpay_order_id
      );

      if (!orderMatchesEnrollment(existingOrder, enrollment.id, amount)) {
        console.error("Stored Razorpay order does not match enrollment", {
          enrollmentId: enrollment.id,
          orderId: existingOrder.id,
        });
        return errorResponse("Stored payment order is invalid", 409);
      }

      if (existingOrder.status === "paid") {
        return errorResponse(
          "This payment has completed and is being reconciled",
          409
        );
      }

      return NextResponse.json(
        {
          order_id: existingOrder.id,
          amount,
          currency: PAYMENT_CURRENCY,
          key_id: getRazorpayKeyId(),
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    // Recover an order created during an earlier request whose database update
    // failed. The stable receipt makes retries safe across process restarts.
    const matchingOrders = await razorpay.orders.all({
      receipt: enrollment.id,
      count: 100,
    });
    const reusableOrder = matchingOrders.items
      .filter(
        (order) =>
          order.status !== "paid" &&
          orderMatchesEnrollment(order, enrollment.id, amount)
      )
      .sort((a, b) => b.created_at - a.created_at)[0];

    const order =
      reusableOrder ??
      (await razorpay.orders.create({
        amount,
        currency: PAYMENT_CURRENCY,
        receipt: enrollment.id,
        partial_payment: false,
        notes: {
          user_id: user.id,
          enrollment_id: enrollment.id,
        },
      }));

    const { data: attachedEnrollment, error: updateError } = await supabase
      .from("enrollments")
      .update({
        razorpay_order_id: order.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", enrollment.id)
      .eq("user_id", user.id)
      .eq("status", "pending")
      .is("razorpay_order_id", null)
      .select("id, razorpay_order_id")
      .maybeSingle();

    if (updateError) {
      console.error("Could not attach Razorpay order to enrollment", {
        enrollmentId: enrollment.id,
        orderId: order.id,
        error: updateError.message,
      });
      return errorResponse("Could not save the payment order", 500);
    }

    if (!attachedEnrollment) {
      // A concurrent request won the conditional update. Return only the
      // server-stored order; never expose the losing orphan order to Checkout.
      const { data: concurrentEnrollment, error: concurrentError } =
        await supabase
          .from("enrollments")
          .select("status, razorpay_order_id")
          .eq("id", enrollment.id)
          .eq("user_id", user.id)
          .single();

      if (
        concurrentError ||
        concurrentEnrollment?.status !== "pending" ||
        !concurrentEnrollment.razorpay_order_id
      ) {
        return errorResponse("Payment order conflict", 409);
      }

      const concurrentOrder = await razorpay.orders.fetch(
        concurrentEnrollment.razorpay_order_id
      );
      if (!orderMatchesEnrollment(concurrentOrder, enrollment.id, amount)) {
        return errorResponse("Stored payment order is invalid", 409);
      }

      return NextResponse.json(
        {
          order_id: concurrentOrder.id,
          amount,
          currency: PAYMENT_CURRENCY,
          key_id: getRazorpayKeyId(),
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(
      {
        order_id: order.id,
        amount,
        currency: PAYMENT_CURRENCY,
        key_id: getRazorpayKeyId(),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Razorpay order creation failed", error);
    return errorResponse("Unable to create payment order", 502);
  }
}
