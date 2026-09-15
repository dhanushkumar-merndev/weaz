export const COURSE_SLUGS = ["beginner", "professional", "ai-hero"] as const;

export type CourseSlug = (typeof COURSE_SLUGS)[number];

export function isCourseSlug(value: unknown): value is CourseSlug {
  return (
    typeof value === "string" &&
    (COURSE_SLUGS as readonly string[]).includes(value)
  );
}

/** Short, non-sensitive labels safe to use in any client bundle. */
export const COURSE_BADGES: Record<CourseSlug, { name: string; price: string; accent: string }> = {
  beginner: { name: "Beginner", price: "₹35,000", accent: "#9B59D0" },
  professional: { name: "Professional", price: "₹49,999", accent: "#FBBF24" },
  "ai-hero": { name: "AI Hero", price: "₹60,000", accent: "#38BDF8" },
};

export type SlideKind ="overview" | "concept" | "framework" | "practice" | "recap";

export const SLIDE_KIND_LABEL: Record<SlideKind, string> = {
  overview: "Overview",
  concept: "Core Concept",
  framework: "Framework",
  practice: "Hands-on Lab",
  recap: "Recap & Deliverable",
};

export interface CourseSlide {
  kind: SlideKind;
  title: string;
  /** Presenter-style explanation shown alongside the slide. */
  description: string;
  points: string[];
}

export interface CourseModule {
  key: string;
  title: string;
  summary: string;
  slides: CourseSlide[];
}

export interface CourseMeta {
  slug: CourseSlug;
  /** Matches programs.name, which EnrollmentModal uses to preselect a program. */
  programName: string;
  title: string;
  tag: string;
  description: string;
  accent: string;
  priceLabel: string;
}

export interface Course extends CourseMeta {
  modules: CourseModule[];
}

export interface CourseAccessState {
  slug: CourseSlug;
  hasAccess: boolean;
  /** Latest paid enrollment. `expiresAt` is null for lifetime programs. */
  purchase: { paidAt: string | null; expiresAt: string | null; active: boolean } | null;
  grant: { grantedBy: string; grantedAt: string } | null;
  pendingPayment: boolean;
}

/** Shape returned by GET /api/courses. */
export interface CourseSummary extends CourseMeta {
  modules: { key: string; title: string; slideCount: number }[];
  access: CourseAccessState;
}

/** Shape returned by GET /api/courses/[slug]. */
export interface CourseDetail extends CourseMeta {
  modules: (CourseModule & { googleSlidesEmbedUrl: string | null })[];
  access: CourseAccessState;
}

/** A row returned by GET /api/admin/students. */
export interface StudentRow {
  id: string;
  email: string | null;
  name: string;
  avatarUrl: string | null;
  phone: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  courses: CourseAccessState[];
}

/** A course returned by GET /api/admin/course-slides. */
export interface AdminCourseSlides {
  slug: CourseSlug;
  title: string;
  accent: string;
  linkedToProgram: boolean;
  modules: {
    key: string;
    title: string;
    slideCount: number;
    slidesUrl: string | null;
    updatedBy: string | null;
    updatedAt: string | null;
  }[];
}
