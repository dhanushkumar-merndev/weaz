import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase/api";
import { getSupabaseAdmin } from "@/lib/supabase";

async function isAdmin(email: string | undefined): Promise<boolean> {
  if (!email) return false;
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("admin_users")
    .select("email")
    .eq("email", email.toLowerCase())
    .single();
  return !!data;
}

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user || !(await isAdmin(user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const search = (searchParams.get("search") || "").trim();
  const offset = (page - 1) * limit;

  const supabase = getSupabaseAdmin();

  let query = supabase
    .from("enrollments")
    .select("*, programs(name, duration, price_paise)", { count: "exact" });

  if (search) {
    query = query.or(`form_data->>name.ilike.%${search}%,form_data->>email.ilike.%${search}%,form_data->>phone.ilike.%${search}%`);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data,
    total: count ?? 0,
    page,
    limit,
    totalPages: count ? Math.ceil(count / limit) : 0,
  });
}
