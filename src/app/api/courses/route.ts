import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase/api";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getUserCourseAccess } from "@/lib/course-access";
import {
  getProgramIdsBySlug,
  loadModuleRows,
  resolveCourseModules,
  toCourseMeta,
} from "@/lib/course-modules";
import { courses } from "@/content/courses";
import type { CourseSummary } from "@/lib/course-types";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };

/** The course catalog with the signed-in learner's access to each course. */
export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
  }

  try {
    const supabase = getSupabaseAdmin();
    const [access, programIds] = await Promise.all([
      getUserCourseAccess(user.id, supabase),
      getProgramIdsBySlug(supabase),
    ]);
    const rows = await loadModuleRows(supabase, [...programIds.values()]);

    const summaries: CourseSummary[] = courses.map((course) => {
      const programId = programIds.get(course.slug);
      const modules = resolveCourseModules(
        course.slug,
        rows.filter((row) => row.program_id === programId)
      );
      return {
        ...toCourseMeta(course),
        modules: modules.map((courseModule) => ({
          key: courseModule.key,
          title: courseModule.title,
          slideCount: courseModule.slides.length,
        })),
        access: access.find((state) => state.slug === course.slug)!,
      };
    });

    return NextResponse.json({ courses: summaries }, { headers: NO_STORE });
  } catch (error) {
    console.error("Could not load course access", error);
    return NextResponse.json(
      { error: "Could not load your courses" },
      { status: 500, headers: NO_STORE }
    );
  }
}
