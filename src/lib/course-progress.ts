// Per-viewer slide progress. It lives in localStorage, so it is a convenience
// only: it can be empty (private window, cleared site data) and never syncs
// across devices.

export interface CourseProgress {
  moduleIndex: number;
  slideIndex: number;
  visited: string[];
}

function storageKey(userId: string, slug: string) {
  return `weaz-course-progress:${userId}:${slug}`;
}

export function slideId(moduleKey: string, slideIndex: number) {
  return `${moduleKey}:${slideIndex}`;
}

export function readCourseProgress(userId: string, slug: string): CourseProgress {
  try {
    const parsed: unknown = JSON.parse(
      window.localStorage.getItem(storageKey(userId, slug)) ?? "null"
    );
    if (typeof parsed === "object" && parsed !== null) {
      const saved = parsed as Partial<CourseProgress>;
      return {
        moduleIndex: Number.isInteger(saved.moduleIndex) ? (saved.moduleIndex as number) : 0,
        slideIndex: Number.isInteger(saved.slideIndex) ? (saved.slideIndex as number) : 0,
        visited: Array.isArray(saved.visited)
          ? saved.visited.filter((id): id is string => typeof id === "string")
          : [],
      };
    }
  } catch {
    // Storage may be unavailable; start from the beginning.
  }
  return { moduleIndex: 0, slideIndex: 0, visited: [] };
}

export function writeCourseProgress(userId: string, slug: string, progress: CourseProgress) {
  try {
    window.localStorage.setItem(storageKey(userId, slug), JSON.stringify(progress));
  } catch {
    // Progress is best-effort.
  }
}

export function countViewedSlides(
  modules: { key: string; slideCount: number }[],
  visited: string[]
) {
  const seen = new Set(visited);
  let count = 0;
  for (const courseModule of modules) {
    for (let index = 0; index < courseModule.slideCount; index++) {
      if (seen.has(slideId(courseModule.key, index))) count++;
    }
  }
  return count;
}
