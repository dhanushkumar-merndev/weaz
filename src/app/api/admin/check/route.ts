import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase/api";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ admin: false });
  }

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("admin_users")
    .select("email")
    .eq("email", user.email!.toLowerCase())
    .single();

  return NextResponse.json({ admin: !!data, email: user.email });
}
