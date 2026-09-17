"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Home, Loader2, LogOut, Shield, ShieldAlert } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";

const ADMIN_TABS = [
  { key: "enrollments", href: "/admin", label: "Platform Courses" },
  { key: "students", href: "/admin/students", label: "Students & Access" },
  { key: "course-modules", href: "/admin/course-modules", label: "Course Modules" },
  { key: "webinars", href: "/admin/webinars", label: "Webinars" },
] as const;

export type AdminTab = (typeof ADMIN_TABS)[number]["key"];

export function AdminTabs({ active }: { active: AdminTab }) {
  return (
    <nav className="mb-7 flex max-w-full overflow-x-auto rounded-xl border border-white/[0.07] bg-white/[0.03] p-1 sm:inline-flex">
      {ADMIN_TABS.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={
            tab.key === active
              ? "shrink-0 rounded-lg bg-[#9B59D0] px-4 py-2 text-sm font-medium text-white shadow-lg shadow-[#9B59D0]/20"
              : "shrink-0 rounded-lg px-4 py-2 text-sm font-medium text-white/45 transition hover:text-white"
          }
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

function GateMessage({ tone, title, message }: { tone: "warn" | "deny"; title: string; message: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-[#0F0B14] px-4">
      <div className="max-w-sm text-center">
        <ShieldAlert
          size={48}
          className={`mx-auto mb-4 ${tone === "warn" ? "text-[#FBBF24]" : "text-red-400"}`}
        />
        <h1 className="font-display mb-2 text-2xl font-black text-white">{title}</h1>
        <p className="text-white/50">{message}</p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-5 py-2.5 text-sm text-white/80"
        >
          <Home size={15} /> Go Home
        </Link>
      </div>
    </div>
  );
}

/** Admin sign-in gate, header and section tabs shared by the admin pages. */
export function AdminShell({ active, children }: { active: AdminTab; children: ReactNode }) {
  const { user, loading: authLoading, signOut } = useAuth();
  const {
    data: adminCheck,
    isLoading: adminCheckLoading,
    isError,
  } = useQuery({
    queryKey: ["admin-check"],
    queryFn: async () => {
      const response = await fetch("/api/admin/check", {
        signal: AbortSignal.timeout(12_000),
      });
      if (!response.ok) throw new Error("Could not verify admin access");
      return response.json();
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  if (authLoading || (user && adminCheckLoading)) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#0F0B14]">
        <Loader2 size={32} className="animate-spin text-[#9B59D0]" />
      </div>
    );
  }

  if (!user) {
    return (
      <GateMessage
        tone="warn"
        title="Access Denied"
        message="Please sign in to access the admin panel."
      />
    );
  }

  if (isError || adminCheck?.admin !== true) {
    return (
      <GateMessage
        tone="deny"
        title="Not Authorized"
        message="Admin access could not be verified for this account."
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0B14]">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0F0B14]/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Shield size={18} className="text-[#FBBF24]" />
            <h1 className="font-display text-lg font-black text-white">Admin</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden max-w-[150px] truncate text-xs text-white/40 sm:block">
              {user.email}
            </span>
            <button
              type="button"
              onClick={() => signOut()}
              className="flex items-center gap-1.5 text-xs text-white/40 transition hover:text-white"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <AdminTabs active={active} />
        {children}
      </main>
    </div>
  );
}
