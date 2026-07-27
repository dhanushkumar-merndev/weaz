import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase/api";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("*, programs(name, tagline, duration)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  const currentEnrollment = enrollments?.[0] || null;

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
      image: user.user_metadata?.avatar_url || null,
    },
    enrollment: currentEnrollment,
  });
}
