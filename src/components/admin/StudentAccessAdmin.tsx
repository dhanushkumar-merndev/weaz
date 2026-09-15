"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Lock,
  Search,
  User,
  X,
} from "lucide-react";
import {
  COURSE_BADGES,
  COURSE_SLUGS,
  isCourseSlug,
  type CourseAccessState,
  type CourseSlug,
  type StudentRow,
} from "@/lib/course-types";

interface StudentsResponse {
  data: StudentRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: {
    totalUsers: number;
    withAccess: number;
    perCourse: Record<CourseSlug, number>;
  };
}

type AccessFilter = "all" | "with-access" | "no-access";

const FILTERS: { key: AccessFilter; label: string }[] = [
  { key: "all", label: "All users" },
  { key: "with-access", label: "Has access" },
  { key: "no-access", label: "No access" },
];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function AccessChips({
  student,
  busy,
  onRevoke,
}: {
  student: StudentRow;
  busy: boolean;
  onRevoke: (course: CourseSlug) => void;
}) {
  const chips = student.courses.flatMap((state: CourseAccessState) => {
    const badge = COURSE_BADGES[state.slug];
    const items = [];

    if (state.purchase?.active) {
      items.push(
        <span
          key={`${state.slug}-purchase`}
          title={`Paid ${state.purchase.paidAt ? formatDate(state.purchase.paidAt) : ""}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#22c55e]/25 bg-[#22c55e]/10 px-2.5 py-1 text-xs font-medium text-[#4ade80]"
        >
          <Lock size={11} />
          {badge.name} · Purchased
          <span className="text-[#4ade80]/60">
            {state.purchase.expiresAt ? `till ${formatDate(state.purchase.expiresAt)}` : "lifetime"}
          </span>
        </span>
      );
    } else if (state.purchase && !state.grant) {
      items.push(
        <span
          key={`${state.slug}-expired`}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white/45"
        >
          {badge.name} · Expired
          {state.purchase.expiresAt && ` ${formatDate(state.purchase.expiresAt)}`}
        </span>
      );
    }

    if (state.grant) {
      items.push(
        <span
          key={`${state.slug}-grant`}
          title={`Granted by ${state.grant.grantedBy} on ${formatDate(state.grant.grantedAt)}`}
          className="inline-flex items-center gap-1 rounded-full border border-[#9B59D0]/35 bg-[#9B59D0]/15 py-1 pl-2.5 pr-1 text-xs font-medium text-[#d7b4f3]"
        >
          {badge.name} · Manual
          <button
            type="button"
            disabled={busy}
            onClick={() => onRevoke(state.slug)}
            aria-label={`Remove manual ${badge.name} access`}
            className="grid h-5 w-5 place-items-center rounded-full text-[#d7b4f3]/70 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
          >
            <X size={12} />
          </button>
        </span>
      );
    }

    if (!state.hasAccess && state.pendingPayment) {
      items.push(
        <span
          key={`${state.slug}-pending`}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#FBBF24]/25 bg-[#FBBF24]/10 px-2.5 py-1 text-xs text-[#FBBF24]"
        >
          <Clock size={11} />
          {badge.name} · Payment pending
        </span>
      );
    }

    return items;
  });

  return chips.length ? (
    <div className="flex flex-wrap gap-2">{chips}</div>
  ) : (
    <span className="text-xs text-white/30">No course access</span>
  );
}

export function StudentAccessAdmin() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState<AccessFilter>("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isFetching, isError, error } = useQuery<StudentsResponse>({
    queryKey: ["admin-students", page, debouncedSearch, filter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "25", filter });
      if (debouncedSearch) params.set("search", debouncedSearch);
      const response = await fetch(`/api/admin/students?${params}`);
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "Could not load students");
      return body;
    },
    placeholderData: (previous) => previous,
  });

  const access = useMutation({
    mutationFn: async (change: {
      userId: string;
      course: CourseSlug;
      action: "grant" | "revoke";
    }) => {
      const response = await fetch("/api/admin/students/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(change),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "Could not update course access");
      return body as { courses: CourseAccessState[] };
    },
    onSuccess: (_result, change) => {
      const name = COURSE_BADGES[change.course].name;
      toast.success(change.action === "grant" ? `${name} access granted` : `Manual ${name} access removed`);
      void queryClient.invalidateQueries({ queryKey: ["admin-students"] });
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  const stats = data?.stats;
  const statCards = [
    { label: "Registered users", value: stats?.totalUsers, accent: "#ffffff" },
    { label: "With course access", value: stats?.withAccess, accent: "#22c55e" },
    ...COURSE_SLUGS.map((slug) => ({
      label: COURSE_BADGES[slug].name,
      value: stats?.perCourse[slug],
      accent: COURSE_BADGES[slug].accent,
    })),
  ];

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-white/[0.06] bg-[#15111D]/60 px-4 py-3"
          >
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-white/35">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: card.accent }} />
              {card.label}
            </div>
            <div className="font-display mt-1 text-2xl font-black text-white">
              {card.value ?? "—"}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, phone..."
              className="h-9 w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 text-sm text-white placeholder:text-white/30 transition-colors focus:border-[#9B59D0]/50 focus:outline-none"
            />
          </div>
          <div className="inline-flex w-fit rounded-xl border border-white/[0.07] bg-white/[0.03] p-1">
            {FILTERS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => {
                  setFilter(option.key);
                  setPage(1);
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  filter === option.key ? "bg-white/10 text-white" : "text-white/45 hover:text-white"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-white/40">
          {isFetching && <Loader2 size={14} className="animate-spin" />}
          <span>{data?.total ?? 0} users</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#15111D]/50">
        <div className="hidden grid-cols-[minmax(0,1.1fr)_minmax(0,1.7fr)_210px] gap-4 border-b border-white/[0.06] px-5 py-3 text-[11px] uppercase tracking-wider text-white/30 md:grid">
          <span>Student</span>
          <span>Course access</span>
          <span>Give access</span>
        </div>

        {isLoading ? (
          <div className="grid place-items-center py-16">
            <Loader2 size={24} className="animate-spin text-[#9B59D0]" />
          </div>
        ) : isError ? (
          <div className="py-16 text-center text-sm text-red-400">{(error as Error).message}</div>
        ) : data && data.data.length > 0 ? (
          <ul className="divide-y divide-white/[0.04]">
            {data.data.map((student) => {
              const busy = access.isPending && access.variables?.userId === student.id;
              const grantable = student.courses.filter(
                (state) => !state.grant && !state.purchase?.active
              );

              return (
                <li
                  key={student.id}
                  className="grid gap-4 px-4 py-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.7fr)_210px] md:items-center md:px-5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-[#9B59D0]/30">
                      {student.avatarUrl ? (
                        <img src={student.avatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="grid h-full w-full place-items-center bg-[#9B59D0]">
                          <User size={14} className="text-white" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-white">{student.name}</div>
                      <div className="truncate text-xs text-white/50">{student.email ?? "—"}</div>
                      <div className="truncate text-[11px] text-white/30">
                        {student.phone ? `${student.phone} · ` : ""}Joined {formatDate(student.createdAt)}
                      </div>
                    </div>
                  </div>

                  <AccessChips
                    student={student}
                    busy={busy}
                    onRevoke={(course) => {
                      const label = COURSE_BADGES[course].name;
                      if (
                        window.confirm(
                          `Remove manual ${label} access for ${student.email ?? student.name}?`
                        )
                      ) {
                        access.mutate({ userId: student.id, course, action: "revoke" });
                      }
                    }}
                  />

                  <div className="flex items-center gap-2">
                    <select
                      value=""
                      disabled={busy || grantable.length === 0}
                      onChange={(event) => {
                        const course = event.target.value;
                        if (isCourseSlug(course)) {
                          access.mutate({ userId: student.id, course, action: "grant" });
                        }
                      }}
                      aria-label={`Give course access to ${student.name}`}
                      className="h-9 w-full cursor-pointer rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/80 transition focus:border-[#9B59D0]/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40 [&>option]:bg-[#15111D]"
                    >
                      <option value="">
                        {grantable.length ? "Give course access…" : "Has every course"}
                      </option>
                      {grantable.map((state) => (
                        <option key={state.slug} value={state.slug}>
                          {COURSE_BADGES[state.slug].name} ({COURSE_BADGES[state.slug].price})
                        </option>
                      ))}
                    </select>
                    {busy && <Loader2 size={14} className="shrink-0 animate-spin text-white/40" />}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="py-16 text-center text-sm text-white/30">
            {debouncedSearch || filter !== "all" ? "No matching users." : "No registered users yet."}
          </div>
        )}
      </div>

      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-white/40">
            Page {data.page} of {data.totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-white/60 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(data.totalPages, current + 1))}
              disabled={page >= data.totalPages}
              className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-white/60 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
