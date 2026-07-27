"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type SortingState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useAuth } from "@/providers/AuthProvider";
import { Search, Loader2, ShieldAlert, Shield, ChevronLeft, ChevronRight, ArrowUpDown, LogOut, Home } from "lucide-react";

interface EnrollmentRow {
  id: string;
  user_id: string;
  status: string;
  form_data: { name?: string; email?: string; phone?: string };
  paid_at: string | null;
  created_at: string;
  programs: { name: string; duration: string; price_paise: number } | null;
}

interface ApiResponse {
  data: EnrollmentRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}


export default function AdminPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sorting, setSorting] = useState<SortingState>([]);
  const limit = 20;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: adminCheck } = useQuery({
    queryKey: ["admin-check"],
    queryFn: async () => {
      const res = await fetch("/api/admin/check");
      return res.json();
    },
    enabled: !!user,
  });

  const { data, isFetching } = useQuery<ApiResponse>({
    queryKey: ["admin-enrollments", page, limit, debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await fetch(`/api/admin/enrollments?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    placeholderData: (prev) => prev,
  });

  const columns = useMemo(
    () => [
      { id: "name", header: "Name", accessorFn: (r: EnrollmentRow) => r.form_data?.name, cell: (i: any) => <div className="font-medium text-white truncate max-w-[160px]">{(i.getValue() as string) || "—"}</div> },
      { id: "email", header: "Email", accessorFn: (r: EnrollmentRow) => r.form_data?.email, cell: (i: any) => <div className="text-white/60 truncate max-w-[180px]">{(i.getValue() as string) || "—"}</div> },
      { id: "phone", header: "Phone", accessorFn: (r: EnrollmentRow) => r.form_data?.phone, cell: (i: any) => <div className="text-white/60 font-mono text-sm">{(i.getValue() as string) || "—"}</div> },
      { id: "plan", header: "Plan", accessorFn: (r: EnrollmentRow) => r.programs?.name, cell: (i: any) => <div className="truncate max-w-[160px]"><span className="text-white/90 text-sm">{(i.getValue() as string) || "—"}</span></div> },
      {
        id: "status", accessorKey: "status", header: "Status",
        cell: (i: any) => {
          const s = i.getValue() as string;
          return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s === "paid" ? "bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20" : "bg-[#FBBF24]/10 text-[#FBBF24] border border-[#FBBF24]/20"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${s === "paid" ? "bg-[#22c55e]" : "bg-[#FBBF24]"}`} />
              {s === "paid" ? "Active" : "Pending"}
            </span>
          );
        },
      },
      { id: "paid_at", accessorKey: "paid_at", header: "Paid Date", cell: (i: any) => { const v = i.getValue() as string | null; return <span className="text-white/50 text-sm whitespace-nowrap">{v ? new Date(v).toLocaleDateString("en-IN") : "—"}</span>; } },
      { id: "duration", header: "Duration", accessorFn: (r: EnrollmentRow) => r.programs?.duration, cell: (i: any) => <span className="text-white/50 text-sm whitespace-nowrap">{(i.getValue() as string) || "—"}</span> },
    ],
    []
  );

  const table = useReactTable({
    data: data?.data ?? [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const rows = table.getRowModel().rows;
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 52,
    overscan: 10,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0F0B14] grid place-items-center">
        <Loader2 size={32} className="animate-spin text-[#9B59D0]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0F0B14] grid place-items-center px-4">
        <div className="text-center max-w-sm">
          <ShieldAlert size={48} className="mx-auto text-[#FBBF24] mb-4" />
          <h1 className="font-display text-2xl font-black text-white mb-2">Access Denied</h1>
          <p className="text-white/50">Please sign in to access the admin panel.</p>
          <Link href="/" className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 border border-white/10 text-sm text-white/80 hover:text-white hover:bg-white/15 transition-all">
            <Home size={15} /> Go Home
          </Link>
        </div>
      </div>
    );
  }

  const isAdminUser = adminCheck?.admin === true;

  if (!isAdminUser) {
    return (
      <div className="min-h-screen bg-[#0F0B14] grid place-items-center px-4">
        <div className="text-center max-w-sm">
          <ShieldAlert size={48} className="mx-auto text-red-400 mb-4" />
          <h1 className="font-display text-2xl font-black text-white mb-2">Not Authorized</h1>
          <p className="text-white/50">You don&apos;t have permission to access this panel.</p>
          <Link href="/" className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 border border-white/10 text-sm text-white/80 hover:text-white hover:bg-white/15 transition-all">
            <Home size={15} /> Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0B14]">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0F0B14]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield size={18} className="text-[#FBBF24]" />
            <h1 className="font-display font-black text-white text-lg">Admin</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/40 truncate max-w-[150px] hidden sm:block">{user.email}</span>
            <button onClick={() => signOut()} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors cursor-pointer">
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, phone..."
              className="w-full h-9 pl-9 pr-3 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#9B59D0]/50 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-white/40">
            {isFetching && <Loader2 size={14} className="animate-spin" />}
            <span>{data?.total ?? 0} enrollments</span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-[#15111D]/50 overflow-hidden">
          <div ref={tableContainerRef} className="overflow-auto max-h-[calc(100vh-230px)]">
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-[#15111D]">
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((header) => (
                      <th
                        key={header.id}
                        onClick={header.column.getToggleSortingHandler()}
                        className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-white/30 font-medium cursor-pointer select-none whitespace-nowrap hover:text-white/50 transition-colors"
                      >
                        <div className="flex items-center gap-1">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <ArrowUpDown size={11} className="opacity-40" />
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {virtualizer.getVirtualItems().map((virtualRow) => {
                  const row = rows[virtualRow.index];
                  return (
                    <tr
                      key={row.id}
                      className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                      style={{ height: virtualRow.size }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-0 text-sm whitespace-nowrap">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {rows.length === 0 && (
              <div className="text-center py-16 text-white/30 text-sm">
                {debouncedSearch ? "No results found." : "No enrollments yet."}
              </div>
            )}
          </div>
        </div>

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 text-sm">
            <span className="text-white/40">
              Page {data.page} of {data.totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page >= data.totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
