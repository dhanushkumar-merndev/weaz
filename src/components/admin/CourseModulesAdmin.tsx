"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  Presentation,
  RefreshCw,
  Trash2,
} from "lucide-react";
import type { AdminCourse, AdminCourseModule } from "@/lib/course-types";
import { slidesLinkProblem } from "@/lib/google-slides";

const QUERY_KEY = ["admin-course-modules"];

// Shown when a background refresh finds a deck was switched to editable after
// it was added; adding, relinking and syncing refuse editable decks outright.
const EDIT_ACCESS_WARNING =
  "Anyone with this link can edit these slides. In Google Slides set Share → Anyone with the link → Viewer, then press sync.";

interface ModuleValues {
  title: string;
  summary: string;
  slidesUrl: string;
}

async function requestJson(url: string, init: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json" },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error || "Request failed");
  return body;
}

function timeAgo(value: string | null) {
  if (!value) return "never";
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 24 * 60) return `${Math.round(minutes / 60)} h ago`;
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const inputClass =
  "h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/25 transition-colors focus:border-[#9B59D0]/50 focus:outline-none";

function ModuleForm({
  initial,
  submitLabel,
  pending,
  onSubmit,
  onCancel,
}: {
  initial: ModuleValues;
  submitLabel: string;
  pending: boolean;
  onSubmit: (values: ModuleValues) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState(initial);
  const [submitted, setSubmitted] = useState(false);
  const linkProblem = slidesLinkProblem(values.slidesUrl);
  const set = (field: keyof ModuleValues) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setValues((current) => ({ ...current, [field]: event.target.value }));

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
        if (linkProblem) return;
        onSubmit({
          title: values.title.trim(),
          summary: values.summary.trim(),
          slidesUrl: values.slidesUrl.trim(),
        });
      }}
    >
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-white/60">Google Slides link</span>
        <input
          type="url"
          inputMode="url"
          value={values.slidesUrl}
          onChange={set("slidesUrl")}
          placeholder="https://docs.google.com/presentation/d/…/edit?usp=sharing"
          aria-invalid={submitted && !!linkProblem}
          className={inputClass}
        />
        <span className={`mt-1.5 block text-xs ${submitted && linkProblem ? "text-red-400" : "text-white/35"}`}>
          {submitted && linkProblem
            ? linkProblem
            : "Share → General access → Anyone with the link · Viewer, then copy the link."}
        </span>
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-white/60">Module title</span>
          <input
            value={values.title}
            onChange={set("title")}
            maxLength={120}
            placeholder="Leave empty to use the first slide's title"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-white/60">Short description</span>
          <input
            value={values.summary}
            onChange={set("summary")}
            maxLength={500}
            placeholder="Optional — shown under the module title"
            className={inputClass}
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#9B59D0] px-4 text-sm font-medium text-white transition hover:bg-[#8a4bc0] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending && <Loader2 size={15} className="animate-spin" />}
          {pending ? "Reading slides from Google…" : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="h-10 rounded-xl border border-white/10 px-4 text-sm text-white/60 transition hover:text-white disabled:opacity-40"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-white/55 transition disabled:cursor-not-allowed disabled:opacity-30 ${
        danger ? "hover:border-red-400/40 hover:text-red-300" : "hover:bg-white/5 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function ModuleRow({
  courseModule,
  index,
  total,
}: {
  courseModule: AdminCourseModule;
  index: number;
  total: number;
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [showSlides, setShowSlides] = useState(false);
  const refresh = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });

  const update = useMutation({
    mutationFn: (payload: Partial<ModuleValues> & { sync?: boolean; move?: "up" | "down" }) =>
      requestJson(`/api/admin/course-modules/${courseModule.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }) as Promise<{ module: AdminCourseModule }>,
    onSuccess: ({ module: saved }, payload) => {
      if (payload.sync) toast.success(`Synced ${saved.slideCount} slides from Google Slides`);
      else if (!payload.move) {
        toast.success("Module updated");
        setEditing(false);
      }
      void refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message);
      // A refused save can still record the deck's sharing, so show it.
      void refresh();
    },
  });

  const remove = useMutation({
    mutationFn: () =>
      requestJson(`/api/admin/course-modules/${courseModule.id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success(`Deleted ${courseModule.title}`);
      void refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const busy = update.isPending || remove.isPending;
  const syncing = update.isPending && update.variables?.sync === true;

  if (editing) {
    return (
      <li className="px-4 py-4 sm:px-5">
        <ModuleForm
          initial={{
            title: courseModule.title,
            summary: courseModule.summary,
            slidesUrl: courseModule.slidesUrl,
          }}
          submitLabel="Save changes"
          pending={update.isPending}
          onSubmit={(values) => update.mutate(values)}
          onCancel={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:px-5">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[0.06] font-mono text-xs font-bold text-white/70">
        {String(index + 1).padStart(2, "0")}
      </span>

      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-white">{courseModule.title}</div>
        {courseModule.summary && (
          <p className="mt-0.5 text-xs text-white/50">{courseModule.summary}</p>
        )}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/40">
          <button
            type="button"
            onClick={() => setShowSlides((open) => !open)}
            aria-expanded={showSlides}
            className="inline-flex items-center gap-1 text-[#c994f0] hover:text-[#dcb6f7]"
          >
            {courseModule.slideCount} slides
            <ChevronDown size={12} className={`transition ${showSlides ? "rotate-180" : ""}`} />
          </button>
          <span>Synced {timeAgo(courseModule.syncedAt)}</span>
          <a
            href={courseModule.slidesUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 hover:text-white"
          >
            Open deck <ExternalLink size={11} />
          </a>
        </div>
        {courseModule.publicEditAccess && (
          <p className="mt-2 flex items-start gap-1.5 rounded-lg border border-[#FBBF24]/25 bg-[#FBBF24]/10 px-2.5 py-1.5 text-xs text-[#FBBF24]">
            <AlertTriangle size={13} className="mt-px shrink-0" />
            {EDIT_ACCESS_WARNING}
          </p>
        )}
        {showSlides && (
          <ol
            data-lenis-prevent
            className="mt-3 max-h-56 space-y-1 overflow-y-auto rounded-xl border border-white/[0.06] bg-black/20 p-3 text-xs text-white/60"
          >
            {courseModule.slideTitles.map((title, slideIndex) => (
              <li key={slideIndex}>
                {slideIndex + 1}. {title}
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <IconButton label="Move up" disabled={busy || index === 0} onClick={() => update.mutate({ move: "up" })}>
          <ArrowUp size={14} />
        </IconButton>
        <IconButton
          label="Move down"
          disabled={busy || index === total - 1}
          onClick={() => update.mutate({ move: "down" })}
        >
          <ArrowDown size={14} />
        </IconButton>
        <IconButton label="Sync slides from Google" disabled={busy} onClick={() => update.mutate({ sync: true })}>
          <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
        </IconButton>
        <IconButton label="Edit module" disabled={busy} onClick={() => setEditing(true)}>
          <Pencil size={14} />
        </IconButton>
        <IconButton
          label="Delete module"
          danger
          disabled={busy}
          onClick={() => {
            const note =
              total === 1 ? " This course will go back to showing the built-in modules." : "";
            if (window.confirm(`Delete “${courseModule.title}”? Students will no longer see it.${note}`)) {
              remove.mutate();
            }
          }}
        >
          <Trash2 size={14} />
        </IconButton>
      </div>
    </li>
  );
}

function CourseSection({ course }: { course: AdminCourse }) {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);

  const create = useMutation({
    mutationFn: (values: ModuleValues) =>
      requestJson("/api/admin/course-modules", {
        method: "POST",
        body: JSON.stringify({ course: course.slug, ...values }),
      }) as Promise<{ module: AdminCourseModule }>,
    onSuccess: ({ module: created }) => {
      toast.success(`Added ${created.title} with ${created.slideCount} slides`);
      setAdding(false);
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#15111D]/50">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-4 sm:px-5">
        <div className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: course.accent }} />
          <h2 className="font-display text-lg font-black text-white">{course.title}</h2>
          <span className="text-xs text-white/40">
            {course.modules.length} {course.modules.length === 1 ? "module" : "modules"}
          </span>
        </div>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            disabled={!course.linkedToProgram}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#9B59D0] px-3.5 text-sm font-medium text-white transition hover:bg-[#8a4bc0] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={15} /> Add module
          </button>
        )}
      </header>

      {!course.linkedToProgram && (
        <div className="flex items-center gap-2 border-b border-[#FBBF24]/15 bg-[#FBBF24]/5 px-5 py-3 text-xs text-[#FBBF24]">
          <AlertTriangle size={14} className="shrink-0" />
          This course isn&apos;t linked to a program yet. Apply the course access migration first.
        </div>
      )}

      {adding && (
        <div className="border-b border-white/[0.06] bg-white/[0.02] px-4 py-4 sm:px-5">
          <ModuleForm
            initial={{ title: "", summary: "", slidesUrl: "" }}
            submitLabel="Add module"
            pending={create.isPending}
            onSubmit={(values) => create.mutate(values)}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      {course.modules.length > 0 ? (
        <ul className="divide-y divide-white/[0.04]">
          {course.modules.map((courseModule, index) => (
            <ModuleRow
              key={courseModule.id}
              courseModule={courseModule}
              index={index}
              total={course.modules.length}
            />
          ))}
        </ul>
      ) : (
        <p className="px-5 py-5 text-sm text-white/40">
          No modules yet. Students currently see the {course.builtinModuleCount} built-in WEAZ
          modules; your first module replaces them for this course.
        </p>
      )}
    </section>
  );
}

export function CourseModulesAdmin() {
  const { data, isLoading, isError, error } = useQuery<{ courses: AdminCourse[] }>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const response = await fetch("/api/admin/course-modules");
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "Could not load course modules");
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
              Each module is one Google Slides deck. Its slides appear in the student course page
              automatically.
            </p>
            <ol className="mt-3 list-decimal space-y-1 pl-4 text-white/50">
              <li>
                In Google Slides, open <span className="text-white/75">Share</span> and set General
                access to <span className="text-white/75">Anyone with the link · Viewer</span>.
              </li>
              <li>
                Slide title → heading, slide text → points,{" "}
                <span className="text-white/75">speaker notes → description</span>.
              </li>
              <li>
                Click <span className="text-white/75">Add module</span> and paste the link. Edits in
                Google Slides show up within about 10 minutes, or press sync to update now.
              </li>
            </ol>
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
        data?.courses.map((course) => <CourseSection key={course.slug} course={course} />)
      )}
    </div>
  );
}
