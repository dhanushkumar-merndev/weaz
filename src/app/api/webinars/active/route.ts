import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("webinars")
      .select(
        "id, title, announcement_text, description, price_paise, image_path, starts_at"
      )
      .eq("is_visible", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Could not load active webinar", error.message);
      return NextResponse.json(
        { webinar: null },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    if (!data) {
      return NextResponse.json(
        { webinar: null },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const { data: image } = supabase.storage
      .from("webinar-posters")
      .getPublicUrl(data.image_path);

    return NextResponse.json(
      { webinar: { ...data, image_url: image.publicUrl } },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Active webinar lookup failed", error);
    // The public site must remain unchanged when webinars are unavailable.
    return NextResponse.json(
      { webinar: null },
      { headers: { "Cache-Control": "no-store" } }
    );
  }
}
