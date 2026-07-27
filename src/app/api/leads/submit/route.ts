import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase/api";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isTrustedBrowserRequest } from "@/lib/payment-security";

function parseDurationMonths(duration: string): number | null {
  const match = duration.match(/(\d+)\s*Months?/i);
  if (match) return parseInt(match[1], 10);
  return null;
}

function isExpired(paidAt: string, durationMonths: number): boolean {
  const paid = new Date(paidAt);
  const expiry = new Date(paid);
  expiry.setMonth(expiry.getMonth() + durationMonths);
  return new Date() > expiry;
}

export async function POST(request: Request) {
  if (!isTrustedBrowserRequest(request)) {
    return NextResponse.json(
      { error: "Cross-site request rejected" },
      { status: 403 }
    );
  }

  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const requestData = body as Record<string, unknown>;
  const {
    program_id: programId,
    name,
    phone,
    message,
  } = requestData;

  if (
    !Number.isSafeInteger(programId) ||
    (programId as number) <= 0 ||
    typeof name !== "string" ||
    typeof phone !== "string" ||
    (message !== undefined && typeof message !== "string")
  ) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const normalizedName = name.trim();
  const normalizedPhone = phone.replace(/\D/g, "").replace(/^91/, "");
  const normalizedMessage = message?.trim() ?? "";

  if (
    normalizedName.length < 2 ||
    normalizedName.length > 120 ||
    normalizedPhone.length !== 10 ||
    normalizedMessage.length > 1000
  ) {
    return NextResponse.json(
      { error: "Invalid enrollment details" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();

  // Get program details
  const { data: program, error: programError } = await supabase
    .from("programs")
    .select("duration")
    .eq("id", programId as number)
    .single();

  if (programError && programError.code !== "PGRST116") {
    return NextResponse.json(
      { error: "Failed to load program" },
      { status: 500 }
    );
  }

  if (!program) {
    return NextResponse.json({ error: "Program not found" }, { status: 404 });
  }

  // Check for existing active paid enrollment for this user + program
  const { data: existing, error: existingError } = await supabase
    .from("enrollments")
    .select("status, paid_at")
    .eq("user_id", user.id)
    .eq("program_id", programId as number)
    .eq("status", "paid")
    .order("created_at", { ascending: false })
    .limit(1);

  if (existingError) {
    return NextResponse.json(
      { error: "Failed to check existing enrollment" },
      { status: 500 }
    );
  }

  if (existing && existing.length > 0) {
    const last = existing[0];
    const isFlexible = program.duration.toLowerCase() === "flexible";

    if (isFlexible) {
      return NextResponse.json(
        { error: "You already have a lifetime enrollment in this program. You cannot purchase it again." },
        { status: 409 }
      );
    }

    const durationMonths = parseDurationMonths(program.duration);
    if (durationMonths && last.paid_at && !isExpired(last.paid_at, durationMonths)) {
      return NextResponse.json(
        { error: `You already have an active enrollment in this program (expires in ${durationMonths} months from purchase).` },
        { status: 409 }
      );
    }
  }

  // Reuse the latest pending enrollment so a dismissed or failed Checkout can
  // retry the same Razorpay order instead of creating duplicate orders.
  const { data: pendingEnrollments, error: pendingError } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("program_id", programId as number)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1);

  if (pendingError) {
    return NextResponse.json(
      { error: "Failed to check pending enrollment" },
      { status: 500 }
    );
  }

  const formData = {
    name: normalizedName,
    phone: normalizedPhone,
    message: normalizedMessage,
    email: user.email,
  };
  const pendingEnrollment = pendingEnrollments?.[0];

  if (pendingEnrollment) {
    const { data, error } = await supabase
      .from("enrollments")
      .update({
        form_data: formData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", pendingEnrollment.id)
      .eq("user_id", user.id)
      .eq("status", "pending")
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to update enrollment" },
        { status: 500 }
      );
    }

    return NextResponse.json({ enrollment: data });
  }

  const { data, error } = await supabase
    .from("enrollments")
    .insert({
      user_id: user.id,
      program_id: programId as number,
      status: "pending",
      form_data: formData,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to create enrollment" },
      { status: 500 }
    );
  }

  return NextResponse.json({ enrollment: data });
}
