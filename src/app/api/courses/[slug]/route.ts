import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase/api";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getProgramIdForCourse, getUserCourseAccess } from "@/lib/course-access";
import { getCourse } from "@/content/courses";
import { isCourseSlug, type CourseDetail } from "@/lib/course-types";
import { toGoogleSlidesEmbedUrl } from "@/lib/google-slides";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };

function errorResponse(message: string, status: number, extra: object = {}) {
  return NextResponse.json({ error: message, ...extra }, { status, headers: NO_STORE });
}

/** Full slide content, served only to learners who currently have access. */
export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const course = isCourseSlug(slug) ? getCourse(slug) : null;
  if (!course) {
    return errorResponse("Course not found", 404);
  }

  const user = await getUserFromRequest(request);
  if (!user) {
    return errorResponse("Unauthorized", 401);
  }

  try {
    const supabase = getSupabaseAdmin();
    const access = (await getUserCourseAccess(user.id, supabase)).find(
      (state) => state.slug === course.slug
    )!;

    if (!access.hasAccess) {
      return errorResponse("You don't have access to this course yet", 403, {
        course: {
          slug: course.slug,
          title: course.title,
          programName: course.programName,
          accent: course.accent,
          priceLabel: course.priceLabel,
        },
        access,
      });
    }

    const embedUrlByModule = new Map<string, string | null>();
    const programId = await getProgramIdForCourse(supabase, course.slug);
    if (programId) {
      const { data, error } = await supabase
        .from("course_module_slides")
        .select("module_key, slides_url")
        .eq("program_id", programId);
      if (error) throw new Error(error.message);
      for (const row of data) {
        embedUrlByModule.set(row.module_key, toGoogleSlidesEmbedUrl(row.slides_url));
      }
    }

    const detail: CourseDetail = {
      ...course,
      modules: course.modules.map((module) => ({
        ...module,
        googleSlidesEmbedUrl: embedUrlByModule.get(module.key) ?? null,
      })),
      access,
    };

    return NextResponse.json({ course: detail }, { headers: NO_STORE });
  } catch (error) {
    console.error("Could not load course content", { slug, error });
    return errorResponse("Could not load this course", 500);
  }
}
