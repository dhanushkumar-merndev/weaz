import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase/api";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isEnrollmentId } from "@/lib/payment-security";

function response(body: object, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store, private" },
  });
}

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return response({ error: "Unauthorized" }, 401);

  const webinarId = new URL(request.url).searchParams.get("webinar_id");
  if (!isEnrollmentId(webinarId)) {
    return response({ error: "Invalid webinar id" }, 400);
  }

  const supabase = getSupabaseAdmin();
  const { data: registration, error } = await supabase
    .from("webinar_registrations")
    .select("id, webinars!inner(title, whatsapp_group_url)")
    .eq("user_id", user.id)
    .eq("webinar_id", webinarId)
    .eq("status", "paid")
    .order("paid_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Could not check webinar access", error.message);
    return response({ error: "Could not check webinar access" }, 500);
  }

  if (!registration) {
    return response({ purchased: false });
  }

  const webinar = registration.webinars as {
    title: string;
    whatsapp_group_url: string | null;
  };
  return response({
    purchased: true,
    webinar_title: webinar.title,
    whatsapp_group_url: webinar.whatsapp_group_url,
  });
}
