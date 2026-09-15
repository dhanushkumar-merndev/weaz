import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { recordAdminAction } from "@/lib/admin-audit";
import { getProgramIdForCourse, getUserCourseAccess } from "@/lib/course-access";
import { isCourseSlug } from "@/lib/course-types";
import { isEnrollmentId as isUuid, isTrustedBrowserRequest } from "@/lib/payment-security";

export const runtime = "nodejs";

function jsonResponse(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

/** Grants or revokes manual access to a course. Purchased access is unaffected. */
export async function POST(request: Request) {
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

  const { userId, course, action } =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>)
      : ({} as Record<string, unknown>);

  if (!isUuid(userId) || !isCourseSlug(course) || (action !== "grant" && action !== "revoke")) {
    return jsonResponse({ error: "Invalid access change" }, 400);
  }

  try {
    const supabase = getSupabaseAdmin();
    const programId = await getProgramIdForCourse(supabase, course);
    if (!programId) {
      return jsonResponse(
        { error: "This course is not linked to a program yet. Apply the course access migration." },
        409
      );
    }

    if (action === "grant") {
      const { data: target, error: userError } = await supabase.auth.admin.getUserById(userId);
      if (userError || !target.user) {
        return jsonResponse({ error: "User not found" }, 404);
      }

      const { error } = await supabase
        .from("course_access_grants")
        .upsert(
          { user_id: userId, program_id: programId, granted_by: admin.email.toLowerCase() },
          { onConflict: "user_id,program_id", ignoreDuplicates: true }
        );
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from("course_access_grants")
        .delete()
        .eq("user_id", userId)
        .eq("program_id", programId);
      if (error) throw new Error(error.message);
    }

    await recordAdminAction({
      supabase,
      adminEmail: admin.email,
      action: `course_access.${action}`,
      entityType: "user",
      entityId: userId,
      changes: { course },
    });

    return jsonResponse({ courses: await getUserCourseAccess(userId, supabase) });
  } catch (error) {
    console.error("Could not change course access", { userId, course, action, error });
    return jsonResponse({ error: "Could not update course access" }, 500);
  }
}
