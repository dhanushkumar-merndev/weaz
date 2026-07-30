import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase/api";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isEnrollmentId, isTrustedBrowserRequest } from "@/lib/payment-security";

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  if (!isTrustedBrowserRequest(request)) {
    return errorResponse("Cross-site request rejected", 403);
  }

  const user = await getUserFromRequest(request);
  if (!user?.email) return errorResponse("Unauthorized", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  if (typeof body !== "object" || body === null) {
    return errorResponse("Invalid request body", 400);
  }

  const webinarId = "webinar_id" in body ? body.webinar_id : null;
  const name = "name" in body ? body.name : null;
  const phone = "phone" in body ? body.phone : null;

  if (
    !isEnrollmentId(webinarId) ||
    typeof name !== "string" ||
    typeof phone !== "string"
  ) {
    return errorResponse("Missing required fields", 400);
  }

  const normalizedName = name.trim();
  const enteredDigits = phone.replace(/\D/g, "");
  const normalizedPhone =
    enteredDigits.length === 12 && enteredDigits.startsWith("91")
      ? enteredDigits.slice(2)
      : enteredDigits;

  if (
    normalizedName.length < 2 ||
    normalizedName.length > 120 ||
    normalizedPhone.length !== 10
  ) {
    return errorResponse("Enter a valid name and 10-digit phone number", 400);
  }

  const supabase = getSupabaseAdmin();
  const { data: webinar, error: webinarError } = await supabase
    .from("webinars")
    .select("id, price_paise")
    .eq("id", webinarId)
    .eq("is_visible", true)
    .is("deleted_at", null)
    .maybeSingle();

  if (webinarError) return errorResponse("Could not load the webinar", 500);
  if (!webinar) return errorResponse("This webinar is not available", 404);

  const { data: paid } = await supabase
    .from("webinar_registrations")
    .select("id")
    .eq("user_id", user.id)
    .eq("webinar_id", webinar.id)
    .eq("status", "paid")
    .limit(1);

  if (paid?.length) {
    return errorResponse("You are already registered for this webinar", 409);
  }

  const formData = {
    name: normalizedName,
    phone: normalizedPhone,
    email: user.email,
  };

  const { data: pending, error: pendingError } = await supabase
    .from("webinar_registrations")
    .select("id, amount_paise, razorpay_order_id")
    .eq("user_id", user.id)
    .eq("webinar_id", webinar.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(100);

  if (pendingError) return errorResponse("Could not prepare registration", 500);

  const reusablePending = pending?.find(
    (registration) =>
      registration.amount_paise === webinar.price_paise ||
      (registration.amount_paise === null &&
        registration.razorpay_order_id === null)
  );

  if (reusablePending) {
    const { data, error } = await supabase
      .from("webinar_registrations")
      .update({
        amount_paise: webinar.price_paise,
        form_data: formData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reusablePending.id)
      .eq("user_id", user.id)
      .eq("status", "pending")
      .select()
      .single();

    if (error) return errorResponse("Could not update registration", 500);
    return NextResponse.json({ registration: data });
  }

  const { data, error } = await supabase
    .from("webinar_registrations")
    .insert({
      user_id: user.id,
      webinar_id: webinar.id,
      status: "pending",
      amount_paise: webinar.price_paise,
      form_data: formData,
    })
    .select()
    .single();

  if (error) return errorResponse("Could not create registration", 500);
  return NextResponse.json({ registration: data });
}
