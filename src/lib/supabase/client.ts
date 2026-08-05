import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";
import { browserSupabaseCredentials } from "@/lib/supabase/config";

export function createClient() {
  const [url, anonKey] = browserSupabaseCredentials();
  return createBrowserClient<Database>(url, anonKey);
}
