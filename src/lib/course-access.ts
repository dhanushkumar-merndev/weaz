import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase";
import { enrollmentExpiry, parseDurationMonths } from "@/lib/enrollment-period";
import {
  COURSE_SLUGS,
  isCourseSlug,
  type CourseAccessState,
  type CourseSlug,
} from "@/lib/course-types";

type SupabaseAdmin = ReturnType<typeof getSupabaseAdmin>;
type CourseStates = Record<CourseSlug, CourseAccessState>;

/** Supabase caps a single response at 1000 rows. */
const PAGE_SIZE = 1000;

export interface EnrollmentAccessRow {
  user_id: string;
  status: string;
  paid_at: string | null;
  created_at: string;
  form_data?: unknown;
  programs: { slug: string | null; duration: string } | null;
}

export interface GrantAccessRow {
  user_id: string;
  granted_by: string;
  created_at: string;
  programs: { slug: string | null } | null;
}

const ENROLLMENT_ACCESS_COLUMNS =
  "user_id, status, paid_at, created_at, form_data, programs!inner(slug, duration)";
const GRANT_ACCESS_COLUMNS =
  "user_id, granted_by, created_at, programs!inner(slug)";

function emptyState(slug: CourseSlug): CourseAccessState {
  return { slug, hasAccess: false, purchase: null, grant: null, pendingPayment: false };
}

function statesFor(map: Map<string, CourseStates>, userId: string) {
  let states = map.get(userId);
  if (!states) {
    states = Object.fromEntries(
      COURSE_SLUGS.map((slug) => [slug, emptyState(slug)])
    ) as CourseStates;
    map.set(userId, states);
  }
  return states;
}

/**
 * A course is unlocked by a paid enrollment that is still inside its program
 * duration (the same window /api/leads/submit enforces), or by a manual grant,
 * which lasts until an admin revokes it.
 */
export function buildCourseAccess(
  enrollments: EnrollmentAccessRow[],
  grants: GrantAccessRow[],
  now = new Date()
) {
  const map = new Map<string, CourseStates>();

  for (const row of enrollments) {
    const slug = row.programs?.slug;
    if (!isCourseSlug(slug)) continue;
    const state = statesFor(map, row.user_id)[slug];

    if (row.status === "pending") {
      state.pendingPayment = true;
      continue;
    }
    if (row.status !== "paid") continue;

    const current = state.purchase?.paidAt ?? "";
    if (state.purchase && (row.paid_at ?? "") <= current) continue;

    const months = row.programs ? parseDurationMonths(row.programs.duration) : null;
    const expiry = months && row.paid_at ? enrollmentExpiry(row.paid_at, months) : null;
    state.purchase = {
      paidAt: row.paid_at,
      expiresAt: expiry?.toISOString() ?? null,
      active: !expiry || now <= expiry,
    };
  }

  for (const row of grants) {
    const slug = row.programs?.slug;
    if (!isCourseSlug(slug)) continue;
    statesFor(map, row.user_id)[slug].grant = {
      grantedBy: row.granted_by,
      grantedAt: row.created_at,
    };
  }

  for (const states of map.values()) {
    for (const state of Object.values(states)) {
      state.hasAccess = Boolean(state.purchase?.active || state.grant);
      if (state.purchase?.active) state.pendingPayment = false;
    }
  }

  return map;
}

export function toAccessList(states: CourseStates | undefined): CourseAccessState[] {
  return COURSE_SLUGS.map((slug) => states?.[slug] ?? emptyState(slug));
}

export async function getUserCourseAccess(
  userId: string,
  supabase: SupabaseAdmin = getSupabaseAdmin()
) {
  const [enrollments, grants] = await Promise.all([
    supabase.from("enrollments").select(ENROLLMENT_ACCESS_COLUMNS).eq("user_id", userId),
    supabase.from("course_access_grants").select(GRANT_ACCESS_COLUMNS).eq("user_id", userId),
  ]);
  if (enrollments.error) throw new Error(enrollments.error.message);
  if (grants.error) throw new Error(grants.error.message);

  const map = buildCourseAccess(
    enrollments.data as unknown as EnrollmentAccessRow[],
    grants.data as unknown as GrantAccessRow[]
  );
  return toAccessList(map.get(userId));
}

async function fetchAllRows<T>(
  fetchPage: (
    from: number,
    to: number
  ) => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>
) {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await fetchPage(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    rows.push(...((data ?? []) as T[]));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}

/** Every enrollment and grant, for the admin student list. */
export async function loadAllAccessRows(supabase: SupabaseAdmin) {
  const [enrollments, grants] = await Promise.all([
    fetchAllRows<EnrollmentAccessRow>((from, to) =>
      supabase
        .from("enrollments")
        .select(ENROLLMENT_ACCESS_COLUMNS)
        .order("created_at", { ascending: false })
        .range(from, to)
    ),
    fetchAllRows<GrantAccessRow>((from, to) =>
      supabase
        .from("course_access_grants")
        .select(GRANT_ACCESS_COLUMNS)
        .order("created_at", { ascending: false })
        .range(from, to)
    ),
  ]);
  return { enrollments, grants };
}

export async function getProgramIdForCourse(supabase: SupabaseAdmin, slug: CourseSlug) {
  const { data, error } = await supabase
    .from("programs")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.id ?? null;
}
