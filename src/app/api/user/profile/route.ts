import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase/api";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getUserCourseAccess } from "@/lib/course-access";
import { getCourse } from "@/content/courses";

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  const [{ data: enrollments }, courses] = await Promise.all([
    supabase
      .from("enrollments")
      .select("*, programs(name, tagline, duration)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1),
    // Navigation only needs to know which courses are unlocked; a failure here
    // must not break the profile response.
    getUserCourseAccess(user.id, supabase)
      .then((states) =>
        states
          .filter((state) => state.hasAccess)
          .map((state) => ({
            slug: state.slug,
            name: getCourse(state.slug)?.programName ?? state.slug,
          }))
      )
      .catch((error) => {
        console.error("Could not load course access for profile", error);
        return [] as { slug: string; name: string }[];
      }),
  ]);

  const currentEnrollment = enrollments?.[0] || null;

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
      image: user.user_metadata?.avatar_url || null,
    },
    enrollment: currentEnrollment,
    // Courses the user can open now, whether purchased or granted by an admin.
    courseAccess: courses.map((course) => course.slug),
    courses,
  });
}
