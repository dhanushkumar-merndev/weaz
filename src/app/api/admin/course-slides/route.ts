import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { recordAdminAction } from "@/lib/admin-audit";
import { getProgramIdForCourse } from "@/lib/course-access";
import { courses, getCourse } from "@/content/courses";
import { COURSE_SLUGS, isCourseSlug, type AdminCourseSlides } from "@/lib/course-types";
import { toGoogleSlidesEmbedUrl } from "@/lib/google-slides";
import { isTrustedBrowserRequest } from "@/lib/payment-security";

export const runtime = "nodejs";

const MAX_URL_LENGTH = 2000;

function jsonResponse(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

/** Every course module with its Google Slides link, if one is attached. */
export async function GET(request: Request) {
  if (!(await getAdminFromRequest(request))) {
    return jsonResponse({ error: "Forbidden" }, 403);
  }

  try {
    const supabase = getSupabaseAdmin();
    const [programs, links] = await Promise.all([
      supabase.from("programs").select("id, slug").in("slug", [...COURSE_SLUGS]),
      supabase.from("course_module_slides").select("*"),
    ]);
    if (programs.error) throw new Error(programs.error.message);
    if (links.error) throw new Error(links.error.message);

    const result: AdminCourseSlides[] = courses.map((course) => {
      const programId = programs.data.find((program) => program.slug === course.slug)?.id;
      return {
        slug: course.slug,
        title: course.title,
        accent: course.accent,
        linkedToProgram: programId !== undefined,
        modules: course.modules.map((module) => {
          const link = links.data.find(
            (row) => row.program_id === programId && row.module_key === module.key
          );
          return {
            key: module.key,
            title: module.title,
            slideCount: module.slides.length,
            slidesUrl: link?.slides_url ?? null,
            updatedBy: link?.updated_by ?? null,
            updatedAt: link?.updated_at ?? null,
          };
        }),
      };
    });

    return jsonResponse({ courses: result });
  } catch (error) {
    console.error("Could not load course slides", error);
    return jsonResponse({ error: "Could not load course slides" }, 500);
  }
}

/** Attaches, replaces or (with an empty url) removes a module's Google Slides deck. */
export async function PUT(request: Request) {
  if (!isTrustedBrowserRequest(request)) {
    return jsonResponse({ error: "Cross-site request rejected" }, 403);
  }

  const admin = await getAdminFromRequest(request);
  if (!admin?.email) {
    return jsonResponse({ error: "Forbidden" }, 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const { course, moduleKey, slidesUrl } =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>)
      : ({} as Record<string, unknown>);

  const courseContent = isCourseSlug(course) ? getCourse(course) : null;
  const courseModule = courseContent?.modules.find((module) => module.key === moduleKey);
  if (!courseContent || !courseModule || typeof slidesUrl !== "string") {
    return jsonResponse({ error: "Invalid course module" }, 400);
  }

  const trimmed = slidesUrl.trim();
  if (trimmed && (trimmed.length > MAX_URL_LENGTH || !toGoogleSlidesEmbedUrl(trimmed))) {
    return jsonResponse(
      { error: "Paste a Google Slides link (https://docs.google.com/presentation/…)" },
      400
    );
  }

  try {
    const supabase = getSupabaseAdmin();
    const programId = await getProgramIdForCourse(supabase, courseContent.slug);
    if (!programId) {
      return jsonResponse(
        { error: "This course is not linked to a program yet. Apply the course access migration." },
        409
      );
    }

    const adminEmail = admin.email.toLowerCase();
    const updatedAt = new Date().toISOString();

    if (trimmed) {
      const { error } = await supabase.from("course_module_slides").upsert(
        {
          program_id: programId,
          module_key: courseModule.key,
          // new URL() normalises the link so it satisfies the table's CHECK.
          slides_url: new URL(trimmed).href,
          updated_by: adminEmail,
          updated_at: updatedAt,
        },
        { onConflict: "program_id,module_key" }
      );
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from("course_module_slides")
        .delete()
        .eq("program_id", programId)
        .eq("module_key", courseModule.key);
      if (error) throw new Error(error.message);
    }

    await recordAdminAction({
      supabase,
      adminEmail,
      action: trimmed ? "course_slides.update" : "course_slides.remove",
      entityType: "course_module",
      entityId: `${courseContent.slug}/${courseModule.key}`,
      changes: trimmed ? { slides_url: new URL(trimmed).href } : {},
    });

    return jsonResponse({
      slidesUrl: trimmed ? new URL(trimmed).href : null,
      updatedBy: trimmed ? adminEmail : null,
      updatedAt: trimmed ? updatedAt : null,
    });
  } catch (error) {
    console.error("Could not save course slides", { course, moduleKey, error });
    return jsonResponse({ error: "Could not save the slides link" }, 500);
  }
}
