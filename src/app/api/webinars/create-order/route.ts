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
    const registrationId =
      typeof body === "object" &&
      body !== null &&
      "registration_id" in body
        ? body.registration_id
        : null;
    if (!isEnrollmentId(registrationId)) {
      return errorResponse("Invalid registration_id", 400);
    }

    const supabase = getSupabaseAdmin();
    const { data: registration, error } = await supabase
      .from("webinar_registrations")
      .select("id, status, razorpay_order_id, webinars!inner(price_paise)")
      .eq("id", registrationId)
      .eq("user_id", user.id)
      .single();

    if (error || !registration) return errorResponse("Registration not found", 404);
    if (registration.status !== "pending") {
      return errorResponse("This registration is not awaiting payment", 409);
    }

    const amount = asPositiveInteger(
      (registration.webinars as { price_paise: number }).price_paise
    );
    if (!amount) return errorResponse("The webinar has an invalid price", 500);

    const razorpay = getRazorpay();
    if (registration.razorpay_order_id) {
      const order = await razorpay.orders.fetch(registration.razorpay_order_id);
      if (!orderMatches(order, registration.id, amount)) {
        return errorResponse("Stored payment order is invalid", 409);
      }
      if (order.status === "paid") {
        return errorResponse("This payment is being reconciled", 409);
      }
      return NextResponse.json({
        order_id: order.id,
        amount,
        currency: PAYMENT_CURRENCY,
        key_id: getRazorpayKeyId(),
      });
    }

    const matching = await razorpay.orders.all({
      receipt: registration.id,
      count: 100,
    });
    const reusable = matching.items
      .filter(
        (order) =>
          order.status !== "paid" &&
          orderMatches(order, registration.id, amount)
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
          user_id: user.id,
          webinar_registration_id: registration.id,
        },
      }));

    const { data: attached, error: updateError } = await supabase
      .from("webinar_registrations")
      .update({
        razorpay_order_id: order.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", registration.id)
      .eq("user_id", user.id)
      .eq("status", "pending")
      .is("razorpay_order_id", null)
      .select("razorpay_order_id")
      .maybeSingle();

    if (updateError) return errorResponse("Could not save payment order", 500);
    if (!attached) {
      const { data: concurrent } = await supabase
        .from("webinar_registrations")
        .select("razorpay_order_id, status")
        .eq("id", registration.id)
        .eq("user_id", user.id)
        .single();
      if (concurrent?.status !== "pending" || !concurrent.razorpay_order_id) {
        return errorResponse("Payment order conflict", 409);
      }
      const stored = await razorpay.orders.fetch(concurrent.razorpay_order_id);
      if (!orderMatches(stored, registration.id, amount)) {
        return errorResponse("Stored payment order is invalid", 409);
      }
      return NextResponse.json({
        order_id: stored.id,
        amount,
        currency: PAYMENT_CURRENCY,
        key_id: getRazorpayKeyId(),
      });
    }

    return NextResponse.json({
      order_id: order.id,
      amount,
      currency: PAYMENT_CURRENCY,
      key_id: getRazorpayKeyId(),
    });
  } catch (error) {
    console.error("Webinar Razorpay order creation failed", error);
    return errorResponse("Unable to create payment order", 502);
  }
}
