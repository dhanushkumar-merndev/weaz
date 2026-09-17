import { after, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase/api";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getProgramIdForCourse, getUserCourseAccess } from "@/lib/course-access";
import {
  loadModuleRows,
  refreshStaleModules,
  resolveCourseModules,
  toCourseMeta,
} from "@/lib/course-modules";
import { getCourse } from "@/content/courses";
import { isCourseSlug, type CourseDetail } from "@/lib/course-types";

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

    const programId = await getProgramIdForCourse(supabase, course.slug);
    const rows = programId ? await loadModuleRows(supabase, [programId]) : [];

    const detail: CourseDetail = {
      ...toCourseMeta(course),
      modules: resolveCourseModules(course.slug, rows),
      access,
    };

    // Serve the stored slides now; pick up edits made in Google Slides for
    // the next visit.
    if (rows.length) after(() => refreshStaleModules(supabase, rows));

    return NextResponse.json({ course: detail }, { headers: NO_STORE });
  } catch (error) {
    console.error("Could not load course content", { slug, error });
    return errorResponse("Could not load this course", 500);
  }
}
