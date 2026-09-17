import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { recordAdminAction } from "@/lib/admin-audit";
import type { Json, TablesUpdate } from "@/lib/database.types";
import { MODULE_TITLE_MAX, readModuleFields } from "@/lib/course-module-input";
import { toAdminModule } from "@/lib/course-modules";
import { fetchGoogleSlides, GoogleSlidesError } from "@/lib/google-slides-import";
import { isEnrollmentId as isUuid, isTrustedBrowserRequest } from "@/lib/payment-security";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

function jsonResponse(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

async function authorise(request: Request) {
  if (!isTrustedBrowserRequest(request)) {
    return { response: jsonResponse({ error: "Cross-site request rejected" }, 403) };
  }
  const admin = await getAdminFromRequest(request);
  if (!admin?.email) {
    return { response: jsonResponse({ error: "Forbidden" }, 403) };
  }
  return { adminEmail: admin.email.toLowerCase() };
}

/**
 * Edits a module. Body fields (all optional): title, summary, slidesUrl,
 * `sync: true` to re-read the deck, or `move: "up" | "down"` to reorder.
 */
export async function PATCH(request: Request, context: RouteContext) {
  const auth = await authorise(request);
  if (auth.response) return auth.response;
  const { adminEmail } = auth;

  const { id } = await context.params;
  if (!isUuid(id)) {
    return jsonResponse({ error: "Module not found" }, 404);
  }

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (typeof parsed !== "object" || parsed === null) throw new Error();
    body = parsed as Record<string, unknown>;
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: row, error: loadError } = await supabase
      .from("course_modules")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (loadError) throw new Error(loadError.message);
    if (!row) {
      return jsonResponse({ error: "Module not found" }, 404);
    }

    if (body.move === "up" || body.move === "down") {
      const { data: siblings, error } = await supabase
        .from("course_modules")
        .select("id, position")
        .eq("program_id", row.program_id)
        .order("position", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);

      const order = siblings.map((sibling) => sibling.id);
      const from = order.indexOf(id);
      const to = body.move === "up" ? from - 1 : from + 1;

      if (to >= 0 && to < order.length) {
        [order[from], order[to]] = [order[to], order[from]];
        // Renumber from the list order so legacy duplicate positions heal too.
        for (const [position, moduleId] of order.entries()) {
          if (siblings.find((sibling) => sibling.id === moduleId)?.position === position) continue;
          const { error: moveError } = await supabase
            .from("course_modules")
            .update({ position })
            .eq("id", moduleId);
          if (moveError) throw new Error(moveError.message);
        }

        await recordAdminAction({
          supabase,
          adminEmail,
          action: "course_module.move",
          entityType: "course_module",
          entityId: id,
          changes: { direction: body.move },
        });
      }

      return jsonResponse({ module: toAdminModule(row) });
    }

    const input = readModuleFields(body);
    if ("error" in input) {
      return jsonResponse({ error: input.error }, 400);
    }
    const { fields } = input;
    if (fields.title === "") {
      return jsonResponse({ error: `Title must be 2–${MODULE_TITLE_MAX} characters.` }, 400);
    }

    const updates: TablesUpdate<"course_modules"> = {};
    if (fields.title !== undefined && fields.title !== row.title) updates.title = fields.title;
    if (fields.summary !== undefined && fields.summary !== row.summary) {
      updates.summary = fields.summary;
    }
    const linkChanged = fields.slidesUrl !== undefined && fields.slidesUrl !== row.slides_url;
    if (linkChanged) {
      updates.slides_url = fields.slidesUrl;
      updates.presentation_id = fields.presentationId;
    }

    const editedFields = Object.keys(updates);
    let slideCount: number | undefined;

    if (linkChanged || body.sync === true) {
      try {
        const deck = await fetchGoogleSlides(fields.presentationId ?? row.presentation_id);
        updates.slides = deck.slides as unknown as Json;
        updates.synced_at = new Date().toISOString();
        slideCount = deck.slides.length;
      } catch (error) {
        if (error instanceof GoogleSlidesError) {
          return jsonResponse({ error: error.message, code: error.code }, 422);
        }
        throw error;
      }
    }

    if (!Object.keys(updates).length) {
      return jsonResponse({ module: toAdminModule(row) });
    }
    if (editedFields.length) {
      updates.updated_by = adminEmail;
      updates.updated_at = new Date().toISOString();
    }

    const { data: saved, error } = await supabase
      .from("course_modules")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    await recordAdminAction({
      supabase,
      adminEmail,
      action: editedFields.length ? "course_module.update" : "course_module.sync",
      entityType: "course_module",
      entityId: id,
      changes: { fields: editedFields, slide_count: slideCount },
    });

    return jsonResponse({ module: toAdminModule(saved) });
  } catch (error) {
    console.error("Could not update course module", { id, error });
    return jsonResponse({ error: "Could not update the module" }, 500);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await authorise(request);
  if (auth.response) return auth.response;
  const { adminEmail } = auth;

  const { id } = await context.params;
  if (!isUuid(id)) {
    return jsonResponse({ error: "Module not found" }, 404);
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("course_modules")
      .delete()
      .eq("id", id)
      .select("id, title")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) {
      return jsonResponse({ error: "Module not found" }, 404);
    }

    await recordAdminAction({
      supabase,
      adminEmail,
      action: "course_module.delete",
      entityType: "course_module",
      entityId: id,
      changes: { title: data.title },
    });

    return jsonResponse({ deleted: true });
  } catch (error) {
    console.error("Could not delete course module", { id, error });
    return jsonResponse({ error: "Could not delete the module" }, 500);
  }
}
