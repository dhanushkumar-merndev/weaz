import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase/api";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isEnrollmentId } from "@/lib/payment-security";
import { getConfirmedAccess } from "@/lib/webinar-registration";

function response(body: object, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store, private" },
  });
}

/**
 * The private group link is returned only for a confirmed registration that
 * belongs to the signed-in user, whether it was free or paid.
 */
export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return response({ error: "Unauthorized" }, 401);

  const webinarId = new URL(request.url).searchParams.get("webinar_id");
  if (!isEnrollmentId(webinarId)) {
    return response({ error: "Invalid webinar id" }, 400);
  }

  try {
    const access = await getConfirmedAccess(
      getSupabaseAdmin(),
      user.id,
      webinarId
    );
    if (!access) return response({ purchased: false, registered: false });

    return response({
      // `purchased` is kept for the previous client bundle.
      purchased: true,
      registered: true,
      registration_id: access.registrationId,
      status: access.status,
      registration_type: access.registrationType,
      amount_paid: access.amountPaid,
      webinar_title: access.webinarTitle,
      whatsapp_group_url: access.privateGroupLink,
    });
  } catch (error) {
    console.error("Could not check webinar access", error);
    return response({ error: "Could not check webinar access" }, 500);
  }
}
