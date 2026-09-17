import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase";
import type { Json, Tables } from "@/lib/database.types";
import { getCourse } from "@/content/courses";
import {
  COURSE_SLUGS,
  isCourseSlug,
  type AdminCourseModule,
  type Course,
  type CourseDetail,
  type CourseMeta,
  type CourseSlide,
  type CourseSlug,
} from "@/lib/course-types";
import { toGoogleSlidesEmbedUrl } from "@/lib/google-slides";
import { fetchGoogleSlides } from "@/lib/google-slides-import";

type SupabaseAdmin = ReturnType<typeof getSupabaseAdmin>;
export type CourseModuleRow = Tables<"course_modules">;

/** How old a module's stored slide text may get before it is re-read from Google. */
const SYNC_INTERVAL_MS = 10 * 60 * 1000;
/** Retry interval for modules still missing Google slide ids. */
const MISSING_IDS_RETRY_MS = 60 * 1000;

export function toCourseMeta(course: Course): CourseMeta {
  const { slug, programName, title, tag, description, accent, priceLabel } = course;
  return { slug, programName, title, tag, description, accent, priceLabel };
}

export function parseStoredSlides(value: Json): CourseSlide[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item !== "object" || item === null || Array.isArray(item)) return [];
    const { title, description, points, googleSlideId } = item;
    if (typeof title !== "string") return [];
    return [
      {
        title,
        description: typeof description === "string" ? description : "",
        points: Array.isArray(points)
          ? points.filter((point): point is string => typeof point === "string")
          : [],
        ...(typeof googleSlideId === "string" && /^[A-Za-z0-9_-]+$/.test(googleSlideId)
          ? { googleSlideId }
          : {}),
      },
    ];
  });
}

export async function getProgramIdsBySlug(supabase: SupabaseAdmin) {
  const { data, error } = await supabase
    .from("programs")
    .select("id, slug")
    .in("slug", [...COURSE_SLUGS]);
  if (error) throw new Error(error.message);

  const ids = new Map<CourseSlug, number>();
  for (const program of data) {
    if (isCourseSlug(program.slug)) ids.set(program.slug, program.id);
  }
  return ids;
}

export async function loadModuleRows(supabase: SupabaseAdmin, programIds: number[]) {
  if (!programIds.length) return [];
  const { data, error } = await supabase
    .from("course_modules")
    .select("*")
    .in("program_id", programIds)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Admin-created modules replace the built-in ones as soon as a course has any
 * module with at least one slide.
 */
export function resolveCourseModules(
  slug: CourseSlug,
  rows: CourseModuleRow[]
): CourseDetail["modules"] {
  const dynamic = rows
    .map((row) => ({
      key: row.id,
      title: row.title,
      summary: row.summary,
      slides: parseStoredSlides(row.slides),
      googleSlidesEmbedUrl: toGoogleSlidesEmbedUrl(row.slides_url),
    }))
    .filter((courseModule) => courseModule.slides.length > 0);

  if (dynamic.length) return dynamic;
  return (getCourse(slug)?.modules ?? []).map((courseModule) => ({
    ...courseModule,
    googleSlidesEmbedUrl: null,
  }));
}

export function toAdminModule(row: CourseModuleRow): AdminCourseModule {
  const slides = parseStoredSlides(row.slides);
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    slidesUrl: row.slides_url,
    slideCount: slides.length,
    slideTitles: slides.map((slide) => slide.title),
    publicEditAccess: row.public_edit_access,
    syncedAt: row.synced_at,
    updatedBy: row.updated_by,
    updatedAt: row.updated_at,
  };
}

/**
 * Re-reads decks whose stored text is older than the sync interval, so edits
 * in Google Slides reach learners without an admin action. Modules whose
 * slides lack Google page ids (synced before ids were stored) are refreshed
 * sooner so slide navigation starts working. Each module is claimed with a
 * conditional update on the synced_at value read, so concurrent requests
 * don't all call Google; a failed read keeps the previous slides.
 */
export async function refreshStaleModules(supabase: SupabaseAdmin, rows: CourseModuleRow[]) {
  for (const row of rows) {
    const missingIds = parseStoredSlides(row.slides).some((slide) => !slide.googleSlideId);
    const interval = missingIds ? MISSING_IDS_RETRY_MS : SYNC_INTERVAL_MS;
    if (row.synced_at && new Date(row.synced_at).getTime() > Date.now() - interval) continue;

    const claim = supabase
      .from("course_modules")
      .update({ synced_at: new Date().toISOString() })
      .eq("id", row.id);
    const { data: claimed } = await (row.synced_at
      ? claim.eq("synced_at", row.synced_at)
      : claim.is("synced_at", null)
    )
      .select("id")
      .maybeSingle();
    if (!claimed) continue;

    try {
      const deck = await fetchGoogleSlides(row.presentation_id);
      const { error } = await supabase
        .from("course_modules")
        .update({
          slides: deck.slides as unknown as Json,
          public_edit_access: deck.publicEditAccess,
        })
        .eq("id", row.id);
      if (error) throw new Error(error.message);
    } catch (error) {
      console.error("Background Google Slides sync failed", { moduleId: row.id, error });
    }
  }
}
