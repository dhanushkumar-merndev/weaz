import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase/api";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isEnrollmentId, isTrustedBrowserRequest } from "@/lib/payment-security";
import { createWebinarPaymentOrder } from "@/lib/webinar-registration";

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
  try {
    if (!isTrustedBrowserRequest(request)) {
      return jsonResponse({ error: "Cross-site request rejected" }, 403);
    }

    const { id } = await context.params;
    if (!isEnrollmentId(id)) {
      return jsonResponse({ error: "Invalid webinar id" }, 400);
    }

    const user = await getUserFromRequest(request);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }
    const registrationId =
      typeof body === "object" && body !== null && "registration_id" in body
        ? body.registration_id
        : null;
    if (!isEnrollmentId(registrationId)) {
      return jsonResponse({ error: "Invalid registration_id" }, 400);
    }

    const supabase = getSupabaseAdmin();
    const result = await createWebinarPaymentOrder({
      supabase,
      userId: user.id,
      registrationId,
    });

    // The order must belong to the webinar named in the path.
    if (result.ok && result.body.registration_id) {
      const { data: owned } = await supabase
        .from("webinar_registrations")
        .select("id")
        .eq("id", registrationId)
        .eq("webinar_id", id)
        .maybeSingle();
      if (!owned) {
        return jsonResponse(
          { error: "Registration does not belong to this webinar" },
          404
        );
      }
    }

    return jsonResponse(result.body, result.status);
  } catch (error) {
    console.error("Webinar payment order creation failed", error);
    return jsonResponse({ error: "Unable to create payment order" }, 502);
  }
}
