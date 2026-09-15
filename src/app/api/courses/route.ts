import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase/api";
import { getUserCourseAccess } from "@/lib/course-access";
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
    const access = await getUserCourseAccess(user.id);
    const summaries: CourseSummary[] = courses.map(({ modules, ...meta }) => ({
      ...meta,
      modules: modules.map((module) => ({
        key: module.key,
        title: module.title,
        slideCount: module.slides.length,
      })),
      access: access.find((state) => state.slug === meta.slug)!,
    }));

    return NextResponse.json({ courses: summaries }, { headers: NO_STORE });
  } catch (error) {
    console.error("Could not load course access", error);
    return NextResponse.json(
      { error: "Could not load your courses" },
      { status: 500, headers: NO_STORE }
    );
  }
}
