"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, ExternalLink, Loader2, Presentation } from "lucide-react";
import type { AdminCourseSlides } from "@/lib/course-types";
import { toGoogleSlidesEmbedUrl } from "@/lib/google-slides";

type AdminModule = AdminCourseSlides["modules"][number];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ModuleSlidesRow({
  course,
  courseModule,
  index,
}: {
  course: AdminCourseSlides;
  courseModule: AdminModule;
  index: number;
}) {
  const queryClient = useQueryClient();
  const saved = courseModule.slidesUrl ?? "";
  const [draft, setDraft] = useState(saved);
  const trimmed = draft.trim();
  const invalid = trimmed !== "" && !toGoogleSlidesEmbedUrl(trimmed);
  const previewUrl = saved ? toGoogleSlidesEmbedUrl(saved) : null;

  const save = useMutation({
    mutationFn: async (slidesUrl: string) => {
      const response = await fetch("/api/admin/course-slides", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course: course.slug, moduleKey: courseModule.key, slidesUrl }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "Could not save the slides link");
      return body;
    },
    onSuccess: (_result, slidesUrl) => {
      toast.success(
        slidesUrl
          ? `Google Slides linked to ${courseModule.title}`
          : `${courseModule.title} now uses the built-in slides`
      );
      void queryClient.invalidateQueries({ queryKey: ["admin-course-slides"] });
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  return (
    <li className="grid gap-3 px-4 py-4 sm:px-5 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)] lg:items-start lg:gap-6">
      <div className="flex items-start gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[0.06] font-mono text-xs font-bold text-white/70">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white">{courseModule.title}</div>
          <div className="mt-0.5 text-xs">
            {saved ? (
              <span className="text-[#4ade80]">Google Slides linked</span>
            ) : (
              <span className="text-white/40">{courseModule.slideCount} built-in slides</span>
            )}
          </div>
        </div>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!invalid && trimmed !== saved) save.mutate(trimmed);
        }}
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="url"
            inputMode="url"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="https://docs.google.com/presentation/d/…"
            aria-label={`Google Slides link for ${courseModule.title}`}
            aria-invalid={invalid}
            className={`h-10 min-w-0 flex-1 rounded-xl border bg-white/5 px-3 text-sm text-white placeholder:text-white/25 transition-colors focus:outline-none ${
              invalid
                ? "border-red-400/50 focus:border-red-400"
                : "border-white/10 focus:border-[#9B59D0]/50"
            }`}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={save.isPending || invalid || trimmed === saved}
              className="inline-flex h-10 min-w-20 items-center justify-center rounded-xl bg-[#9B59D0] px-4 text-sm font-medium text-white transition hover:bg-[#8a4bc0] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {save.isPending ? <Loader2 size={15} className="animate-spin" /> : "Save"}
            </button>
            {saved && (
              <button
                type="button"
                disabled={save.isPending}
                onClick={() => save.mutate("")}
                className="h-10 rounded-xl border border-white/10 px-3 text-sm text-white/60 transition hover:border-red-400/40 hover:text-red-300 disabled:opacity-40"
              >
                Remove
              </button>
            )}
          </div>
        </div>

        {invalid ? (
          <p className="mt-1.5 text-xs text-red-400">
            That isn&apos;t a Google Slides link. Copy it from the Share dialog in Google Slides.
          </p>
        ) : saved && courseModule.updatedAt ? (
          <p className="mt-1.5 text-xs text-white/35">
            Updated {formatDate(courseModule.updatedAt)}
            {courseModule.updatedBy && ` by ${courseModule.updatedBy}`}
            {previewUrl && (
              <>
                {" · "}
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[#c994f0] hover:underline"
                >
                  Preview <ExternalLink size={11} />
                </a>
              </>
            )}
          </p>
        ) : null}
      </form>
    </li>
  );
}

export function CourseSlidesAdmin() {
  const { data, isLoading, isError, error } = useQuery<{ courses: AdminCourseSlides[] }>({
    queryKey: ["admin-course-slides"],
    queryFn: async () => {
      const response = await fetch("/api/admin/course-slides");
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "Could not load course slides");
      return body;
    },
  });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/[0.06] bg-[#15111D]/60 p-5">
        <div className="flex items-start gap-3">
          <Presentation size={20} className="mt-0.5 shrink-0 text-[#FBBF24]" />
          <div className="text-sm text-white/60">
            <p className="font-medium text-white">
              Every module comes with 5 built-in WEAZ slides. Attach a Google Slides deck to show
              it to students as well.
            </p>
            <ol className="mt-3 list-decimal space-y-1 pl-4 text-white/50">
              <li>
                In Google Slides, open <span className="text-white/75">Share</span> and set General
                access to <span className="text-white/75">Anyone with the link · Viewer</span>.
              </li>
              <li>Copy the link and paste it next to the module below.</li>
              <li>
                Only students who purchased the course or were given access can see it on their
                course page, with a switch back to the built-in slides.
              </li>
            </ol>
            <p className="mt-3 text-xs text-white/35">
              Anyone who has the Google link itself can open the deck, so keep sharing on Viewer.
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-16">
          <Loader2 size={24} className="animate-spin text-[#9B59D0]" />
        </div>
      ) : isError ? (
        <div className="py-16 text-center text-sm text-red-400">{(error as Error).message}</div>
      ) : (
        data?.courses.map((course) => (
          <section
            key={course.slug}
            className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#15111D]/50"
          >
            <header className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-4 sm:px-5">
              <div className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: course.accent }} />
                <h2 className="font-display text-lg font-black text-white">{course.title}</h2>
              </div>
              <span className="text-xs text-white/40">{course.modules.length} modules</span>
            </header>

            {!course.linkedToProgram && (
              <div className="flex items-center gap-2 border-b border-[#FBBF24]/15 bg-[#FBBF24]/5 px-5 py-3 text-xs text-[#FBBF24]">
                <AlertTriangle size={14} />
                This course isn&apos;t linked to a program yet. Apply the course access migration
                before saving links.
              </div>
            )}

            <ul className="divide-y divide-white/[0.04]">
              {course.modules.map((courseModule, index) => (
                <ModuleSlidesRow
                  key={`${courseModule.key}-${courseModule.slidesUrl ?? ""}`}
                  course={course}
                  courseModule={courseModule}
                  index={index}
                />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
