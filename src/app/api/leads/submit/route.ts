import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase/api";
import { getSupabaseAdmin } from "@/lib/supabase";

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
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { program_id, name, phone, message } = body;

  if (!program_id || !name || !phone) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Get program details
  const { data: program } = await supabase
    .from("programs")
    .select("duration")
    .eq("id", program_id)
    .single();

  if (!program) {
    return NextResponse.json({ error: "Program not found" }, { status: 404 });
  }

  // Check for existing active paid enrollment for this user + program
  const { data: existing } = await supabase
    .from("enrollments")
    .select("status, paid_at")
    .eq("user_id", user.id)
    .eq("program_id", program_id)
    .eq("status", "paid")
    .order("created_at", { ascending: false })
    .limit(1);

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

  const { data, error } = await supabase
    .from("enrollments")
    .insert({
      user_id: user.id,
      program_id,
      status: "pending",
      form_data: { name, phone, message, email: user.email },
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ enrollment: data });
}
