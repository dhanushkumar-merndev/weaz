import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { ACTIVE_WEBINAR_CACHE_TAG } from "@/lib/webinar-cache";
import { isEnrollmentId, isTrustedBrowserRequest } from "@/lib/payment-security";
import { diffFields, recordAdminAction } from "@/lib/admin-audit";
import { parseFreeRegistrationSettings } from "@/lib/webinar-admin-settings";
import { buildAvailability, type WebinarRow } from "@/lib/webinar-registration";

export const runtime = "nodejs";

function jsonResponse(body: object, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

const SETTINGS_COLUMNS =
  "id, title, price_paise, starts_at, is_visible, free_registration_enabled, free_slot_limit, free_slots_claimed, free_registration_starts_at, free_registration_ends_at";

/**
 * Updates the free-registration settings of a single webinar. The slot limit
 * may be raised or lowered at any time but never below the number of free
 * registrations already confirmed; the database check constraint is the final
 * guard behind this explicit comparison.
 */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!isTrustedBrowserRequest(request)) {
    return jsonResponse({ error: "Cross-site request rejected" }, 403);
  }
  const admin = await getAdminFromRequest(request);
  if (!admin?.email) return jsonResponse({ error: "Forbidden" }, 403);

  const { id } = await context.params;
  if (!isEnrollmentId(id)) {
    return jsonResponse({ error: "Invalid webinar id" }, 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }
  if (typeof body !== "object" || body === null) {
    return jsonResponse({ error: "Invalid request body" }, 400);
  }

  const payload = body as Record<string, unknown>;
  const parsed = parseFreeRegistrationSettings((key) => {
    const value = payload[key];
    return typeof value === "boolean" ||
      typeof value === "string" ||
      typeof value === "number"
      ? value
      : value === null
        ? null
        : undefined;
  });
  if (!parsed.ok) return jsonResponse({ error: parsed.error }, 400);

  const supabase = getSupabaseAdmin();
  const { data: existing, error: loadError } = await supabase
    .from("webinars")
    .select(SETTINGS_COLUMNS)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (loadError) return jsonResponse({ error: "Could not load the webinar" }, 503);
  if (!existing) return jsonResponse({ error: "Webinar not found" }, 404);

  if (parsed.settings.free_slot_limit < existing.free_slots_claimed) {
    return jsonResponse(
      {
        error: `The free slot limit cannot go below the ${existing.free_slots_claimed} free registrations already confirmed`,
        free_slots_claimed: existing.free_slots_claimed,
      },
      409
    );
  }

  const { data, error } = await supabase
    .from("webinars")
    .update({ ...parsed.settings, updated_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null)
    .select(SETTINGS_COLUMNS)
    .single();

  if (error) {
    if (error.code === "23514") {
      return jsonResponse(
        {
          error:
            "The free slot limit cannot go below the free registrations already confirmed",
        },
        409
      );
    }
    console.error("Webinar free settings update failed", error.message);
    return jsonResponse({ error: "Could not update the webinar" }, 500);
  }

  revalidateTag(ACTIVE_WEBINAR_CACHE_TAG, { expire: 0 });
  await recordAdminAction({
    supabase,
    adminEmail: admin.email,
    action: "webinar.free_settings_update",
    entityType: "webinar",
    entityId: id,
    changes: diffFields(
      {
        free_registration_enabled: existing.free_registration_enabled,
        free_slot_limit: existing.free_slot_limit,
        free_registration_starts_at: existing.free_registration_starts_at,
        free_registration_ends_at: existing.free_registration_ends_at,
      },
      parsed.settings
    ),
  });

  return jsonResponse({
    webinar: data,
    availability: buildAvailability(data as unknown as WebinarRow),
  });
}
