import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase/api";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isEnrollmentId, isTrustedBrowserRequest } from "@/lib/payment-security";
import { registerForWebinar } from "@/lib/webinar-registration";

export const runtime = "nodejs";

function jsonResponse(body: object, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store, private" },
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!isTrustedBrowserRequest(request)) {
    return jsonResponse({ error: "Cross-site request rejected" }, 403);
  }

  const { id } = await context.params;
  if (!isEnrollmentId(id)) {
    return jsonResponse({ error: "Invalid webinar id" }, 400);
  }

  const user = await getUserFromRequest(request);
  if (!user?.email) return jsonResponse({ error: "Unauthorized" }, 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }
  if (typeof body !== "object" || body === null) {
    return jsonResponse({ error: "Invalid request body" }, 400);
  }

  const name = "name" in body ? body.name : null;
  const phone = "phone" in body ? body.phone : null;
  if (typeof name !== "string" || typeof phone !== "string") {
    return jsonResponse({ error: "Missing required fields" }, 400);
  }

  try {
    const outcome = await registerForWebinar({
      supabase: getSupabaseAdmin(),
      user,
      webinarId: id,
      name,
      phone,
      // Consent to pay only. Pricing and free eligibility stay server-side.
      acceptPaid: "accept_paid" in body && body.accept_paid === true,
    });

    switch (outcome.kind) {
      case "CONFIRMED":
        return jsonResponse({
          success: true,
          registrationId: outcome.registrationId,
          registrationType: outcome.registrationType,
          status: outcome.status,
          amountPaid: outcome.amountPaise / 100,
          privateGroupLink: outcome.privateGroupLink,
          availability: outcome.availability,
        });

      case "PAYMENT_PENDING":
        return jsonResponse({
          success: true,
          registrationId: outcome.registrationId,
          registrationType: "PAID",
          status: "PAYMENT_PENDING",
          amountDue: outcome.amountPaise / 100,
          paymentRequired: true,
          availability: outcome.availability,
        });

      case "PAYMENT_REQUIRED":
        return jsonResponse(
          {
            success: false,
            code: outcome.code,
            message: outcome.message,
            paymentRequired: true,
            availability: outcome.availability,
          },
          409
        );

      default:
        return jsonResponse(
          { error: outcome.message, availability: outcome.availability },
          outcome.status
        );
    }
  } catch (error) {
    console.error("Webinar registration failed", error);
    return jsonResponse({ error: "Could not complete the registration" }, 500);
  }
}
