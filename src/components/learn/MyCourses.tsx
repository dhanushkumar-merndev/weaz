"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, Clock, Layers, Loader2, Lock } from "lucide-react";
import Navbar from "@/components/weaz/Navbar";
import Footer from "@/components/weaz/Footer";
import { EnrollmentModal } from "@/components/weaz/EnrollmentModal";
import { useAuth } from "@/providers/AuthProvider";
import type { CourseSummary } from "@/lib/course-types";
import { countViewedSlides, readCourseProgress } from "@/lib/course-progress";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function totalSlides(course: CourseSummary) {
  return course.modules.reduce((sum, courseModule) => sum + courseModule.slideCount, 0);
}

function TagPill({ course }: { course: CourseSummary }) {
  return (
    <span
      className="inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em]"
      style={{
        background: `${course.accent}1f`,
        border: `1px solid ${course.accent}55`,
        color: course.accent,
      }}
    >
      <Clock size={12} />
      {course.tag}
    </span>
  );
}

function UnlockedCourseCard({ course, userId }: { course: CourseSummary; userId: string }) {
  const [progress] = useState(() => readCourseProgress(userId, course.slug));
  const slides = totalSlides(course);
  const viewed = countViewedSlides(course.modules, progress.visited);
  const percent = slides ? Math.round((viewed / slides) * 100) : 0;
  const { purchase } = course.access;
  const accessNote = purchase?.active
    ? purchase.expiresAt
      ? `Access until ${formatDate(purchase.expiresAt)}`
      : "Lifetime access"
    : "Access granted by WEAZ Tech";

  return (
    <article className="relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#15111D]/80 p-6 sm:p-7">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full opacity-25 blur-3xl"
        style={{ background: course.accent }}
      />
      <div className="relative flex flex-1 flex-col">
        <TagPill course={course} />
        <h2 className="font-display mt-4 text-2xl font-black text-white">{course.title}</h2>
        <p className="mt-1 text-sm text-white/50">{course.programName}</p>
        <p className="mt-4 text-sm leading-relaxed text-white/70">{course.description}</p>

        <div className="mt-5 flex flex-wrap gap-4 text-xs text-white/55">
          <span className="inline-flex items-center gap-1.5">
            <Layers size={14} /> {course.modules.length} modules
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BookOpen size={14} /> {slides} slides
          </span>
        </div>

        <div className="mt-6">
          <div className="flex justify-between text-xs text-white/50">
            <span>Progress</span>
            <span>{percent}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full transition-[width]"
              style={{ width: `${percent}%`, background: course.accent }}
            />
          </div>
        </div>

        <div className="mt-auto pt-6">
          <Link
            href={`/learn/${course.slug}`}
            className="pill-gold inline-flex w-full items-center justify-center gap-2 px-6 py-3 text-sm"
          >
            {viewed > 0 ? "Continue learning" : "Start learning"} <ArrowRight size={16} />
          </Link>
          <p className="mt-3 text-center text-xs text-white/40">{accessNote}</p>
        </div>
      </div>
    </article>
  );
}

function LockedCourseCard({
  course,
  onEnroll,
}: {
  course: CourseSummary;
  onEnroll: (programName: string) => void;
}) {
  const { purchase, pendingPayment } = course.access;
  const note = pendingPayment
    ? "Your payment is pending. Complete it to unlock this course."
    : purchase?.expiresAt
      ? `Your access ended on ${formatDate(purchase.expiresAt)}.`
      : `${course.modules.length} modules · ${totalSlides(course)} slides`;
  const cta = pendingPayment
    ? "Complete enrollment"
    : purchase
      ? "Renew access"
      : `Unlock for ${course.priceLabel}`;

  return (
    <article className="flex flex-col rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <TagPill course={course} />
        <span className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/5 text-white/50">
          <Lock size={14} />
        </span>
      </div>
      <h2 className="font-display mt-4 text-2xl font-black text-white/85">{course.title}</h2>
      <p className="mt-1 text-sm text-white/45">{course.programName}</p>

      <ul className="mt-5 space-y-2">
        {course.modules.map((courseModule) => (
          <li key={courseModule.key} className="flex items-center gap-2 text-sm text-white/50">
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full opacity-60"
              style={{ background: course.accent }}
            />
            {courseModule.title}
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-6">
        <p className="mb-3 text-xs text-white/40">{note}</p>
        <button
          type="button"
          onClick={() => onEnroll(course.programName)}
          className="pill-ghost inline-flex w-full cursor-pointer items-center justify-center gap-2 px-6 py-3 text-sm"
        >
          {cta} <ArrowRight size={16} />
        </button>
      </div>
    </article>
  );
}

export function MyCourses() {
  const { user, loading, signInWithGoogle } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [defaultProgram, setDefaultProgram] = useState("");

  const openEnroll = (programName = "") => {
    setDefaultProgram(programName);
    setModalOpen(true);
  };

  const { data, isLoading, isError, error, refetch } = useQuery<{ courses: CourseSummary[] }>({
    queryKey: ["my-courses", user?.id],
    queryFn: async () => {
      const response = await fetch("/api/courses");
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "Could not load your courses");
      return body;
    },
    enabled: !!user,
  });

  // A payment completed from this page unlocks the course immediately.
  useEffect(() => {
    const handler = () => void refetch();
    window.addEventListener("enrollment-updated", handler);
    return () => window.removeEventListener("enrollment-updated", handler);
  }, [refetch]);

  const unlocked = data?.courses.filter((course) => course.access.hasAccess) ?? [];
  const locked = data?.courses.filter((course) => !course.access.hasAccess) ?? [];

  let content: React.ReactNode;
  if (loading || (user && isLoading)) {
    content = (
      <div className="grid place-items-center py-24">
        <Loader2 size={28} className="animate-spin text-[#9B59D0]" />
      </div>
    );
  } else if (!user) {
    content = (
      <div className="mx-auto max-w-md rounded-3xl border border-white/10 bg-[#15111D]/80 p-8 text-center">
        <Lock size={32} className="mx-auto text-[#FBBF24]" />
        <h2 className="font-display mt-4 text-2xl font-black text-white">Sign in to continue</h2>
        <p className="mt-2 text-sm text-white/55">
          Sign in with the Google account you enrolled with to open your course slides.
        </p>
        <button
          type="button"
          onClick={() => void signInWithGoogle()}
          className="pill-gold mt-6 cursor-pointer px-8 py-3 text-sm"
        >
          Sign in with Google
        </button>
      </div>
    );
  } else if (isError) {
    content = (
      <div className="py-16 text-center">
        <p className="text-sm text-red-400">{(error as Error).message}</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="pill-ghost mt-4 cursor-pointer px-6 py-2.5 text-sm"
        >
          Try again
        </button>
      </div>
    );
  } else {
    content = (
      <>
        {unlocked.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {unlocked.map((course) => (
              <UnlockedCourseCard key={course.slug} course={course} userId={user.id} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-[#FBBF24]/20 bg-[#FBBF24]/5 p-6 sm:p-8">
            <h2 className="font-display text-xl font-black text-white">
              You haven&apos;t unlocked a course yet
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-white/60">
              Enroll in a program below and your course slides appear here right after payment.
              Paid offline? Contact the WEAZ Tech team and we&apos;ll unlock your course.
            </p>
          </div>
        )}

        {locked.length > 0 && (
          <section className="mt-16">
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-[#9B59D0]">
              {unlocked.length > 0 ? "Explore more programs" : "Available programs"}
            </div>
            <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {locked.map((course) => (
                <LockedCourseCard key={course.slug} course={course} onEnroll={openEnroll} />
              ))}
            </div>
          </section>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0B14]">
      <Navbar onEnroll={() => openEnroll()} />

      {/* Top spacing sits on the inner div: globals.css sets main's padding-top
          to the announcement bar height, which would override it here. */}
      <main className="relative overflow-hidden">
        <div className="blob blob-purple" style={{ width: 450, height: 450, top: -150, left: -100 }} />
        <div className="blob blob-gold" style={{ width: 350, height: 350, top: 50, right: -100 }} />

        <div className="relative z-10 mx-auto max-w-7xl px-4 pb-20 pt-32 sm:px-6 md:pt-40">
          <div className="mb-10 max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#9B59D0]/30 bg-[#9B59D0]/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-[#9B59D0]">
              My Learning
            </div>
            <h1 className="font-display text-4xl font-black tracking-tight text-white sm:text-5xl">
              Your courses
            </h1>
            <p className="mt-4 text-white/60">
              Every module has a slide deck with explanations. Pick up exactly where you left off.
            </p>
          </div>

          {content}
        </div>
      </main>

      <Footer />
      <EnrollmentModal open={modalOpen} onOpenChange={setModalOpen} defaultProgram={defaultProgram} />
    </div>
  );
}
