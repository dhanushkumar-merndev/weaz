import "server-only";

import { unstable_cache } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase";
import { ACTIVE_WEBINAR_CACHE_TAG } from "@/lib/webinar-cache";

export const getCachedActiveWebinar = unstable_cache(
  async () => {
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
      throw new Error(`Could not load active webinar: ${error.message}`);
    }
    if (!data) return null;

    const { data: image } = supabase.storage
      .from("webinar-posters")
      .getPublicUrl(data.image_path);

    return { ...data, image_url: image.publicUrl };
  },
  ["active-webinar-v1"],
  {
    revalidate: 300,
    tags: [ACTIVE_WEBINAR_CACHE_TAG],
  }
);
