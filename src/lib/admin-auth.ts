import { getUserFromRequest } from "@/lib/supabase/api";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function getAdminFromRequest(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user?.email) return null;

  const { data } = await getSupabaseAdmin()
    .from("admin_users")
    .select("email")
    .eq("email", user.email.toLowerCase())
    .maybeSingle();

  return data ? user : null;
}
