import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { buildCourseAccess, loadAllAccessRows, toAccessList } from "@/lib/course-access";
import { COURSE_SLUGS, type CourseSlug, type StudentRow } from "@/lib/course-types";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };
const USERS_PER_PAGE = 1000;
const MAX_USER_PAGES = 50;

async function listAllUsers(supabase: ReturnType<typeof getSupabaseAdmin>) {
  const users: User[] = [];
  for (let page = 1; page <= MAX_USER_PAGES; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: USERS_PER_PAGE,
    });
    if (error) throw new Error(error.message);
    users.push(...data.users);
    if (data.users.length < USERS_PER_PAGE) break;
  }
  return users;
}

function readPhone(formData: unknown) {
  if (typeof formData !== "object" || formData === null || !("phone" in formData)) {
    return null;
  }
  return typeof formData.phone === "string" && formData.phone ? formData.phone : null;
}

/** Every registered (signed-in) user with their course access. */
export async function GET(request: Request) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: NO_STORE });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25") || 25));
  const search = (searchParams.get("search") || "").trim().toLowerCase();
  const filter = searchParams.get("filter");

  try {
    const supabase = getSupabaseAdmin();
    const [users, rows] = await Promise.all([
      listAllUsers(supabase),
      loadAllAccessRows(supabase),
    ]);
    const accessByUser = buildCourseAccess(rows.enrollments, rows.grants);

    // Enrollments arrive newest first, so the first phone seen is the latest.
    const phoneByUser = new Map<string, string>();
    for (const enrollment of rows.enrollments) {
      if (phoneByUser.has(enrollment.user_id)) continue;
      const phone = readPhone(enrollment.form_data);
      if (phone) phoneByUser.set(enrollment.user_id, phone);
    }

    const students: StudentRow[] = users
      .map((user) => ({
        id: user.id,
        email: user.email ?? null,
        name:
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "User",
        avatarUrl: user.user_metadata?.avatar_url || null,
        phone: phoneByUser.get(user.id) ?? null,
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at ?? null,
        courses: toAccessList(accessByUser.get(user.id)),
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const perCourse = Object.fromEntries(COURSE_SLUGS.map((slug) => [slug, 0])) as Record<
      CourseSlug,
      number
    >;
    let withAccess = 0;
    for (const student of students) {
      const unlocked = student.courses.filter((course) => course.hasAccess);
      if (unlocked.length) withAccess++;
      for (const course of unlocked) perCourse[course.slug]++;
    }

    const filtered = students.filter((student) => {
      const hasAny = student.courses.some((course) => course.hasAccess);
      if (filter === "with-access" && !hasAny) return false;
      if (filter === "no-access" && hasAny) return false;
      if (!search) return true;
      return [student.name, student.email, student.phone].some((value) =>
        value?.toLowerCase().includes(search)
      );
    });

    const offset = (page - 1) * limit;
    return NextResponse.json(
      {
        data: filtered.slice(offset, offset + limit),
        total: filtered.length,
        page,
        limit,
        totalPages: Math.ceil(filtered.length / limit),
        stats: { totalUsers: students.length, withAccess, perCourse },
      },
      { headers: NO_STORE }
    );
  } catch (error) {
    console.error("Could not load students", error);
    return NextResponse.json(
      { error: "Could not load students" },
      { status: 500, headers: NO_STORE }
    );
  }
}
