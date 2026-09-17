import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { recordAdminAction } from "@/lib/admin-audit";
import type { Json } from "@/lib/database.types";
import { courses } from "@/content/courses";
import { getProgramIdForCourse } from "@/lib/course-access";
import { getProgramIdsBySlug, loadModuleRows, toAdminModule } from "@/lib/course-modules";
import { readModuleFields } from "@/lib/course-module-input";
import { isCourseSlug, type AdminCourse } from "@/lib/course-types";
import {
  fetchGoogleSlides,
  GoogleSlidesError,
  isGoogleSlidesConfigured,
} from "@/lib/google-slides-import";
import { isTrustedBrowserRequest } from "@/lib/payment-security";

export const runtime = "nodejs";

function jsonResponse(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

/** Every course with its admin-created modules. */
export async function GET(request: Request) {
  if (!(await getAdminFromRequest(request))) {
    return jsonResponse({ error: "Forbidden" }, 403);
  }

  try {
    const supabase = getSupabaseAdmin();
    const programIds = await getProgramIdsBySlug(supabase);
    const rows = await loadModuleRows(supabase, [...programIds.values()]);

    const result: AdminCourse[] = courses.map((course) => {
      const programId = programIds.get(course.slug);
      return {
        slug: course.slug,
        title: course.title,
        accent: course.accent,
        linkedToProgram: programId !== undefined,
        builtinModuleCount: course.modules.length,
        modules: rows.filter((row) => row.program_id === programId).map(toAdminModule),
      };
    });

    return jsonResponse({ googleApiConfigured: isGoogleSlidesConfigured(), courses: result });
  } catch (error) {
    console.error("Could not load course modules", error);
    return jsonResponse({ error: "Could not load course modules" }, 500);
  }
}

/** Creates a module from a Google Slides deck, reading its slides immediately. */
export async function POST(request: Request) {
  if (!isTrustedBrowserRequest(request)) {
    return jsonResponse({ error: "Cross-site request rejected" }, 403);
  }

  const admin = await getAdminFromRequest(request);
  if (!admin?.email) {
    return jsonResponse({ error: "Forbidden" }, 403);
  }

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (typeof parsed !== "object" || parsed === null) throw new Error();
    body = parsed as Record<string, unknown>;
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  if (!isCourseSlug(body.course)) {
    return jsonResponse({ error: "Invalid course" }, 400);
  }
  if (body.slidesUrl === undefined) {
    return jsonResponse({ error: "Paste the Google Slides link." }, 400);
  }

  const input = readModuleFields(body);
  if ("error" in input) {
    return jsonResponse({ error: input.error }, 400);
  }
  const { fields } = input;

  try {
    const supabase = getSupabaseAdmin();
    const programId = await getProgramIdForCourse(supabase, body.course);
    if (!programId) {
      return jsonResponse(
        { error: "This course is not linked to a program yet. Apply the course access migration." },
        409
      );
    }

    let deck: Awaited<ReturnType<typeof fetchGoogleSlides>>;
    try {
      deck = await fetchGoogleSlides(fields.presentationId!);
    } catch (error) {
      if (error instanceof GoogleSlidesError) {
        return jsonResponse({ error: error.message, code: error.code }, 422);
      }
      throw error;
    }

    const { data: last, error: positionError } = await supabase
      .from("course_modules")
      .select("position")
      .eq("program_id", programId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (positionError) throw new Error(positionError.message);

    const adminEmail = admin.email.toLowerCase();
    const { data: row, error } = await supabase
      .from("course_modules")
      .insert({
        program_id: programId,
        title: fields.title || (deck.title.length >= 2 ? deck.title : "Untitled module"),
        summary: fields.summary ?? "",
        slides_url: fields.slidesUrl!,
        presentation_id: fields.presentationId!,
        slides: deck.slides as unknown as Json,
        synced_at: new Date().toISOString(),
        position: (last?.position ?? -1) + 1,
        created_by: adminEmail,
        updated_by: adminEmail,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    await recordAdminAction({
      supabase,
      adminEmail,
      action: "course_module.create",
      entityType: "course_module",
      entityId: row.id,
      changes: {
        course: body.course,
        title: row.title,
        slides_url: row.slides_url,
        slide_count: deck.slides.length,
      },
    });

    return jsonResponse({ module: toAdminModule(row) }, 201);
  } catch (error) {
    console.error("Could not create course module", error);
    return jsonResponse({ error: "Could not create the module" }, 500);
  }
}
