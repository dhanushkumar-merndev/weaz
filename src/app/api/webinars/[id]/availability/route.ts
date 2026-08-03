import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isEnrollmentId } from "@/lib/payment-security";
import { getWebinarAvailability } from "@/lib/webinar-registration";

export const dynamic = "force-dynamic";

/**
 * Live slot availability. The database is read on every request because a
 * cached count must never decide whether a visitor sees the free call to
 * action.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!isEnrollmentId(id)) {
    return NextResponse.json(
      { error: "Invalid webinar id" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const availability = await getWebinarAvailability(getSupabaseAdmin(), id);
    if (!availability) {
      return NextResponse.json(
        { error: "This webinar is not available" },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }
    return NextResponse.json(availability, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Webinar availability lookup failed", error);
    return NextResponse.json(
      { error: "Could not load slot availability" },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
