"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  ListTree,
  Loader2,
  Lock,
} from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import {
  SLIDE_KIND_LABEL,
  type CourseAccessState,
  type CourseDetail,
} from "@/lib/course-types";
import {
  countViewedSlides,
  readCourseProgress,
  slideId,
  writeCourseProgress,
  type CourseProgress,
} from "@/lib/course-progress";

type LockedCourse = Pick<CourseDetail, "slug" | "title" | "programName" | "accent" | "priceLabel">;

type LoadResult =
  | { status: "ok"; course: CourseDetail }
  | { status: "locked"; course: LockedCourse; access: CourseAccessState }
  | { status: "not-found" };

const pad = (value: number) => String(value).padStart(2, "0");

/** Height of the control bar Google renders at the bottom of a Slides embed. */
const GOOGLE_EMBED_CONTROLS_PX = 37;

function FullScreenMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center bg-[#0F0B14] px-4">
      <div className="max-w-md text-center">{children}</div>
    </div>
  );
}

export function CoursePlayer({ slug }: { slug: string }) {
  const { user, loading, signInWithGoogle } = useAuth();

  const { data, isLoading, isError, error, refetch } = useQuery<LoadResult>({
    queryKey: ["course", slug, user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/courses/${encodeURIComponent(slug)}`);
      const body = await response.json().catch(() => null);
      if (response.ok) return { status: "ok", course: body.course };
      if (response.status === 403 && body?.course) {
        return { status: "locked", course: body.course, access: body.access };
      }
      if (response.status === 404) return { status: "not-found" };
      throw new Error(body?.error || "Could not load this course");
    },
    enabled: !!user,
    refetchOnWindowFocus: false,
  });

  if (loading || (user && isLoading)) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#0F0B14]">
        <Loader2 size={32} className="animate-spin text-[#9B59D0]" />
      </div>
    );
  }

  if (!user) {
    return (
      <FullScreenMessage>
        <Lock size={40} className="mx-auto text-[#FBBF24]" />
        <h1 className="font-display mt-4 text-2xl font-black text-white">Sign in to continue</h1>
        <p className="mt-2 text-white/55">
          Sign in with the Google account you enrolled with to open this course.
        </p>
        <button
          type="button"
          onClick={() => void signInWithGoogle()}
          className="pill-gold mt-6 cursor-pointer px-8 py-3 text-sm"
        >
          Sign in with Google
        </button>
      </FullScreenMessage>
    );
  }

  if (isError) {
    return (
      <FullScreenMessage>
        <p className="text-red-400">{(error as Error).message}</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="pill-ghost mt-5 cursor-pointer px-6 py-2.5 text-sm"
        >
          Try again
        </button>
      </FullScreenMessage>
    );
  }

  if (!data || data.status === "not-found") {
    return (
      <FullScreenMessage>
        <h1 className="font-display text-2xl font-black text-white">Course not found</h1>
        <Link href="/learn" className="pill-ghost mt-6 inline-flex px-6 py-2.5 text-sm">
          Back to My Courses
        </Link>
      </FullScreenMessage>
    );
  }

  if (data.status === "locked") {
    const { course, access } = data;
    return (
      <FullScreenMessage>
        <span
          className="mx-auto grid h-16 w-16 place-items-center rounded-full border"
          style={{ borderColor: `${course.accent}55`, background: `${course.accent}1a`, color: course.accent }}
        >
          <Lock size={26} />
        </span>
        <h1 className="font-display mt-5 text-2xl font-black text-white">{course.title} is locked</h1>
        <p className="mt-2 text-white/55">
          {access.pendingPayment
            ? "Your payment is still pending. Complete it to unlock the slides."
            : access.purchase
              ? "Your access to this course has ended. Renew to continue learning."
              : `Enroll in ${course.programName} (${course.priceLabel}) to unlock every module and slide.`}
        </p>
        <Link href="/learn" className="pill-gold mt-6 inline-flex px-8 py-3 text-sm">
          View enrollment options
        </Link>
      </FullScreenMessage>
    );
  }

  return <PlayerView key={data.course.slug} course={data.course} userId={user.id} />;
}

function PlayerView({ course, userId }: { course: CourseDetail; userId: string }) {
  const [progress, setProgress] = useState<CourseProgress>(() => {
    const saved = readCourseProgress(userId, course.slug);
    const moduleIndex = Math.min(Math.max(saved.moduleIndex, 0), course.modules.length - 1);
    const slideIndex = Math.min(
      Math.max(saved.slideIndex, 0),
      course.modules[moduleIndex].slides.length - 1
    );
    const current = slideId(course.modules[moduleIndex].key, slideIndex);
    return {
      moduleIndex,
      slideIndex,
      visited: saved.visited.includes(current) ? saved.visited : [...saved.visited, current],
    };
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { moduleIndex, slideIndex } = progress;
  const courseModule = course.modules[moduleIndex];
  const slide = courseModule.slides[slideIndex];
  const embedUrl = courseModule.googleSlidesEmbedUrl;
  // Modules with a Google Slides deck show only that deck.
  const view = embedUrl ? "google" : "deck";
  // Slide-by-slide navigation needs every slide's Google page id; decks synced
  // before ids were stored fall back to moving a whole module at a time.
  const moduleLevel =
    view === "google" && !courseModule.slides.every((entry) => entry.googleSlideId);
  const embedSrc =
    embedUrl && slide.googleSlideId
      ? `${embedUrl}&slide=id.${encodeURIComponent(slide.googleSlideId)}`
      : embedUrl;
  const about = moduleLevel ? courseModule.summary : slide.description || courseModule.summary;
  const aboutLabel =
    moduleLevel || !slide.description
      ? "About this module"
      : view === "google"
        ? `About slide ${slideIndex + 1}`
        : "About this slide";
  const lastModule = moduleIndex === course.modules.length - 1;
  const lastSlide = slideIndex === courseModule.slides.length - 1;

  const moduleSizes = course.modules.map((item) => ({ key: item.key, slideCount: item.slides.length }));
  const total = moduleSizes.reduce((sum, item) => sum + item.slideCount, 0);
  const viewed = countViewedSlides(moduleSizes, progress.visited);
  const percent = total ? Math.round((viewed / total) * 100) : 0;
  const visited = new Set(progress.visited);

  useEffect(() => {
    writeCourseProgress(userId, course.slug, progress);
  }, [userId, course.slug, progress]);

  const goTo = (nextModule: number, nextSlide: number, markModuleComplete = false) => {
    setProgress((previous) => {
      const ids = new Set(previous.visited);
      if (markModuleComplete) {
        course.modules[previous.moduleIndex].slides.forEach((_, index) =>
          ids.add(slideId(course.modules[previous.moduleIndex].key, index))
        );
      }
      ids.add(slideId(course.modules[nextModule].key, nextSlide));
      return { moduleIndex: nextModule, slideIndex: nextSlide, visited: [...ids] };
    });
    setSidebarOpen(false);
  };

  const next = () => {
    if (moduleLevel) {
      goTo(lastModule ? moduleIndex : moduleIndex + 1, 0, true);
    } else if (!lastSlide) {
      goTo(moduleIndex, slideIndex + 1);
    } else if (!lastModule) {
      goTo(moduleIndex + 1, 0);
    }
  };

  const previous = () => {
    if (moduleLevel) {
      if (moduleIndex > 0) goTo(moduleIndex - 1, 0);
    } else if (slideIndex > 0) {
      goTo(moduleIndex, slideIndex - 1);
    } else if (moduleIndex > 0) {
      goTo(moduleIndex - 1, course.modules[moduleIndex - 1].slides.length - 1);
    }
  };

  const atStart = moduleIndex === 0 && (moduleLevel || slideIndex === 0);
  const atEnd = lastModule && (moduleLevel ? false : lastSlide);
  const nextLabel = moduleLevel
    ? lastModule
      ? "Mark complete"
      : "Next module"
    : lastSlide && !lastModule
      ? "Next module"
      : "Next";

  useEffect(() => {
    if (moduleLevel) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      if (event.key === "ArrowRight") next();
      if (event.key === "ArrowLeft") previous();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return (
    <div className="min-h-screen bg-[#0F0B14] text-white">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0F0B14]/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-3 px-4 sm:px-6">
          <Link
            href="/learn"
            className="flex shrink-0 items-center gap-1.5 text-sm text-white/60 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">My Courses</span>
          </Link>
          <span className="h-5 w-px shrink-0 bg-white/10" />
          <div className="min-w-0 flex-1">
            <div className="font-display truncate text-sm font-bold">{course.title}</div>
          </div>
          <div className="hidden items-center gap-2 text-xs text-white/50 sm:flex">
            <div className="h-1.5 w-28 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full transition-[width]"
                style={{ width: `${percent}%`, background: course.accent }}
              />
            </div>
            {percent}%
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen((open) => !open)}
            aria-expanded={sidebarOpen}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white/70 lg:hidden"
          >
            <ListTree size={14} /> Modules
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] lg:grid lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside
          data-lenis-prevent
          className={`${sidebarOpen ? "block" : "hidden"} border-b border-white/5 lg:sticky lg:top-14 lg:block lg:h-[calc(100vh-3.5rem)] lg:overflow-y-auto lg:border-b-0 lg:border-r`}
        >
          <nav className="space-y-1.5 p-4" aria-label="Course modules">
            {course.modules.map((item, index) => {
              const done = item.slides.filter((_, i) => visited.has(slideId(item.key, i))).length;
              const current = index === moduleIndex;
              return (
                <div
                  key={item.key}
                  className={`rounded-2xl border ${current ? "border-white/10 bg-white/[0.04]" : "border-transparent"}`}
                >
                  <button
                    type="button"
                    onClick={() => goTo(index, 0)}
                    className="flex w-full items-start gap-3 p-3 text-left"
                  >
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg font-mono text-xs font-bold ${current ? "" : "bg-white/[0.06] text-white/60"}`}
                      style={current ? { background: course.accent, color: "#0F0B14" } : undefined}
                    >
                      {done === item.slides.length ? <Check size={14} /> : pad(index + 1)}
                    </span>
                    <span className="min-w-0">
                      <span className={`block text-sm font-semibold ${current ? "text-white" : "text-white/75"}`}>
                        {item.title}
                      </span>
                      <span className="text-xs text-white/40">
                        {done}/{item.slides.length} slides
                        {item.googleSlidesEmbedUrl && " · Google Slides"}
                      </span>
                    </span>
                  </button>
                  {current && (
                    <ol
                      data-lenis-prevent
                      className={`space-y-0.5 pb-3 pl-14 pr-3 ${item.slides.length > 5 ? "max-h-56 overflow-y-auto" : ""}`}
                    >
                      {item.slides.map((entry, i) => (
                        <li key={i}>
                          <button
                            type="button"
                            onClick={() => goTo(index, i)}
                            className={`w-full py-1.5 text-left text-xs transition ${
                              !moduleLevel && i === slideIndex
                                ? "font-semibold text-white"
                                : "text-white/45 hover:text-white"
                            }`}
                          >
                            {i + 1}. {entry.title}
                          </button>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <div className="mb-5 min-w-0">
            <div className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: course.accent }}>
              Module {pad(moduleIndex + 1)} of {pad(course.modules.length)}
            </div>
            <h1 className="font-display mt-1.5 text-2xl font-black sm:text-3xl">{courseModule.title}</h1>
            {courseModule.summary && (
              <p className="mt-1.5 max-w-2xl text-sm text-white/55">{courseModule.summary}</p>
            )}
          </div>

          {view === "google" && embedSrc ? (
            <div className="relative aspect-video overflow-hidden rounded-3xl border border-white/10 bg-black">
              {/* A new src (a different slide) remounts the embed on that slide.
                  The frame is taller than the box by the height of Google's
                  control bar, which is clipped off: the slide then fills the
                  16:9 box exactly and navigation stays with the page controls. */}
              <iframe
                key={embedSrc}
                src={embedSrc}
                title={`${courseModule.title} — Google Slides`}
                allow="fullscreen"
                allowFullScreen
                className="absolute inset-x-0 top-0 w-full"
                style={{ height: `calc(100% + ${GOOGLE_EMBED_CONTROLS_PX}px)` }}
              />
            </div>
          ) : (
            <motion.section
              key={`${moduleIndex}-${slideIndex}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              aria-roledescription="slide"
              aria-label={`Slide ${slideIndex + 1} of ${courseModule.slides.length}: ${slide.title}`}
              className="relative flex flex-col rounded-3xl border border-white/10 bg-[#15111D] md:aspect-video"
            >
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
                <div
                  className="absolute -right-24 -top-24 h-80 w-80 rounded-full opacity-25 blur-3xl"
                  style={{ background: course.accent }}
                />
                <div className="absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-[#9B59D0] opacity-15 blur-3xl" />
              </div>

              <div className="relative flex flex-1 flex-col p-6 sm:p-8 lg:p-10">
                <div className="flex items-center justify-between gap-4">
                  <span
                    className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em]"
                    style={{
                      background: `${course.accent}1f`,
                      border: `1px solid ${course.accent}55`,
                      color: course.accent,
                    }}
                  >
                    {slide.kind ? SLIDE_KIND_LABEL[slide.kind] : `Module ${pad(moduleIndex + 1)}`}
                  </span>
                  <span className="font-mono text-xs text-white/40">
                    {pad(slideIndex + 1)} / {pad(courseModule.slides.length)}
                  </span>
                </div>

                <h2 className="font-display mt-6 text-2xl font-black leading-tight sm:text-3xl xl:text-4xl">
                  {slide.title}
                </h2>

                <ul className="mt-6 grid gap-3 sm:grid-cols-2 md:mt-auto md:pt-6">
                  {slide.points.map((point, index) => (
                    <li
                      key={index}
                      className="flex gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3 sm:p-4"
                    >
                      <span
                        className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold"
                        style={{ background: `${course.accent}26`, color: course.accent }}
                      >
                        {index + 1}
                      </span>
                      <span className="text-sm leading-snug text-white/85">{point}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-white/30">
                  <span className="font-display font-black">
                    WEAZ<span style={{ color: course.accent }}>.</span>TECH
                  </span>
                  <span className="truncate pl-4">{courseModule.title}</span>
                </div>
              </div>
            </motion.section>
          )}

          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={previous}
              disabled={atStart}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/70 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft size={16} /> <span className="hidden sm:inline">Previous</span>
            </button>

            {!moduleLevel && courseModule.slides.length <= 10 ? (
              <div className="flex items-center gap-1.5">
                {courseModule.slides.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => goTo(moduleIndex, index)}
                    aria-label={`Go to slide ${index + 1}`}
                    aria-current={index === slideIndex}
                    className={`h-2 rounded-full transition-all ${index === slideIndex ? "w-6" : "w-2 bg-white/20 hover:bg-white/40"}`}
                    style={index === slideIndex ? { background: course.accent } : undefined}
                  />
                ))}
              </div>
            ) : (
              <span className="text-xs text-white/40">
                {moduleLevel
                  ? `Module ${moduleIndex + 1} of ${course.modules.length}`
                  : `Slide ${slideIndex + 1} of ${courseModule.slides.length}`}
              </span>
            )}

            <button
              type="button"
              onClick={next}
              disabled={atEnd}
              className="pill-gold flex cursor-pointer items-center gap-1.5 px-5 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              {nextLabel} <ChevronRight size={16} />
            </button>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
            {about ? (
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
                <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">
                  {aboutLabel}
                </div>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-white/75">
                  {about}
                </p>
              </div>
            ) : (
              <div aria-hidden="true" className="hidden lg:block" />
            )}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">
                Your progress
              </div>
              <div className="font-display mt-1 text-3xl font-black">{percent}%</div>
              <p className="mt-1 text-xs text-white/45">
                {percent === 100
                  ? "Course complete — great work!"
                  : `${viewed} of ${total} slides viewed`}
              </p>
              {!moduleLevel && (
                <p className="mt-3 hidden text-xs text-white/30 lg:block">Tip: use ← → keys to move.</p>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
