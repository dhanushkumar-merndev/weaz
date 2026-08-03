"use client";
/* Dynamic Supabase URLs and local blob previews are already WebP-optimized on save. */
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  TriangleAlert,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatIndiaDateTime,
  formatIndiaDateTimeLocal,
} from "@/lib/india-time";

interface Webinar {
  id: string;
  title: string;
  announcement_text: string;
  description: string;
  price_paise: number;
  image_url: string;
  starts_at: string | null;
  is_visible: boolean;
  deleted_at: string | null;
  created_at: string;
  whatsapp_group_url: string | null;
  free_registration_enabled: boolean;
  free_slot_limit: number;
  free_slots_claimed: number;
  free_slots_remaining: number;
  free_registration_starts_at: string | null;
  free_registration_ends_at: string | null;
  registration_total: number;
  paid_registration_count: number;
  free_registration_count: number;
  pending_registration_count: number;
  failed_registration_count: number;
  cancelled_registration_count: number;
}

interface Registration {
  id: string;
  webinar_id: string;
  status: string;
  registration_type: string | null;
  amount_paise: number | null;
  form_data: { name?: string; email?: string; phone?: string };
  paid_at: string | null;
  registered_at: string | null;
  created_at: string;
  razorpay_payment_id: string | null;
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  FREE_CONFIRMED: {
    label: "Free confirmed",
    className: "bg-emerald-500/10 text-emerald-400",
  },
  PAID_CONFIRMED: {
    label: "Paid",
    className: "bg-emerald-500/10 text-emerald-400",
  },
  PAYMENT_PENDING: {
    label: "Payment pending",
    className: "bg-[#FBBF24]/10 text-[#FBBF24]",
  },
  PAYMENT_FAILED: {
    label: "Payment failed",
    className: "bg-red-400/10 text-red-300",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-white/5 text-white/40",
  },
};

function statusBadge(status: string) {
  return (
    STATUS_LABELS[status] ?? {
      label: status,
      className: "bg-white/5 text-white/40",
    }
  );
}

interface WebinarResponse {
  webinars: Webinar[];
  registrations: Registration[];
  registration_page: number;
  registration_limit: number;
  registration_total: number;
  registration_total_pages: number;
}

function formatPrice(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

async function convertImageToWebp(file: File) {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error(
      "This browser could not read that image. Please use JPG, PNG, AVIF or WebP."
    );
  }

  try {
    const maxDimension = 1600;
    const scale = Math.min(
      1,
      maxDimension / Math.max(bitmap.width, bitmap.height)
    );
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("Image conversion is not available");
    context.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.84)
    );
    if (!blob || blob.type !== "image/webp") {
      throw new Error("This browser does not support WebP conversion");
    }
    if (blob.size > 5 * 1024 * 1024) {
      throw new Error("Converted poster is larger than 5 MB");
    }

    const baseName = file.name.replace(/\.[^.]+$/, "") || "webinar-poster";
    return new File([blob], `${baseName}.webp`, {
      type: "image/webp",
      lastModified: Date.now(),
    });
  } finally {
    bitmap.close();
  }
}

const STAT_TONES = {
  success: "text-emerald-400",
  warning: "text-[#FBBF24]",
  danger: "text-[#F87171]",
  muted: "text-white/80",
} as const;

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone: keyof typeof STAT_TONES;
}) {
  return (
    <div className="bg-[#15111D] px-4 py-3">
      <div className="text-[10px] uppercase tracking-wider text-white/30">
        {label}
      </div>
      <div className={`mt-1 font-display text-lg font-black ${STAT_TONES[tone]}`}>
        {value}
      </div>
      <div className="mt-0.5 text-[11px] leading-4 text-white/30">{hint}</div>
    </div>
  );
}

function escapeSpreadsheetXml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function WebinarAdmin() {
  const queryClient = useQueryClient();
  const imageRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const registrationTableRef = useRef<HTMLDivElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copySourceId, setCopySourceId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [registrationWebinarId, setRegistrationWebinarId] = useState("all");
  const [registrationPage, setRegistrationPage] = useState(1);
  const registrationLimit = 50;
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [form, setForm] = useState({
    title: "",
    announcement_text: "",
    description: "",
    price_rupees: "",
    starts_at: "",
    whatsapp_group_url: "",
    free_registration_enabled: false,
    free_slot_limit: "",
    free_registration_starts_at: "",
    free_registration_ends_at: "",
  });

  const { data, isLoading, isError, error, isFetching, refetch } =
    useQuery<WebinarResponse>({
    queryKey: [
      "admin-webinars",
      registrationPage,
      registrationLimit,
      registrationWebinarId,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        registration_page: String(registrationPage),
        registration_limit: String(registrationLimit),
        registration_webinar_id: registrationWebinarId,
      });
      const response = await fetch(`/api/admin/webinars?${params}`, {
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      });
      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        throw new Error(
          response.ok
            ? "The server returned an invalid response."
            : "The production server is temporarily unavailable."
        );
      }
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load webinars");
      return result;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: (previous) => previous,
    retry: 2,
    retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 4_000),
    refetchOnWindowFocus: false,
  });

  const refreshWebinarData = async () => {
    queryClient.removeQueries({ queryKey: ["active-webinar"] });
    await queryClient.invalidateQueries({ queryKey: ["admin-webinars"] });
  };

  const registrations = data?.registrations ?? [];
  // TanStack Virtual intentionally returns imperative measurement functions.
  // eslint-disable-next-line react-hooks/incompatible-library
  const registrationVirtualizer = useVirtualizer({
    count: registrations.length,
    getScrollElement: () => registrationTableRef.current,
    estimateSize: () => 65,
    overscan: 8,
    getItemKey: (index) => registrations[index]?.id ?? index,
  });

  useEffect(() => {
    registrationTableRef.current?.scrollTo({ top: 0 });
  }, [registrationPage, registrationWebinarId]);

  const resetForm = () => {
    setForm({
      title: "",
      announcement_text: "",
      description: "",
      price_rupees: "",
      starts_at: "",
      whatsapp_group_url: "",
      free_registration_enabled: false,
      free_slot_limit: "",
      free_registration_starts_at: "",
      free_registration_ends_at: "",
    });
    setPreview(null);
    setSelectedImage(null);
    setIsDragging(false);
    dragDepth.current = 0;
    setEditingId(null);
    setCopySourceId(null);
    if (imageRef.current) imageRef.current.value = "";
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const image = selectedImage;
    if (!image && !editingId && !copySourceId) {
      toast.error("Choose a webinar poster");
      return;
    }

    const claimed =
      data?.webinars.find((webinar) => webinar.id === editingId)
        ?.free_slots_claimed ?? 0;
    if (claimed > 0 && Number(form.free_slot_limit) < claimed) {
      toast.error(
        `The free slot limit cannot go below the ${claimed} seats already confirmed`
      );
      return;
    }

    const currentActive = data?.webinars.find(
      (webinar) => webinar.is_visible && !webinar.deleted_at
    );
    if (
      !editingId &&
      currentActive &&
      !window.confirm(
        `Publish this webinar now? "${currentActive.title}" will become completed and hidden, while all of its registrations remain preserved.`
      )
    ) {
      return;
    }

    setSaving(true);
    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) =>
        body.append(key, String(value))
      );
      if (editingId) body.append("id", editingId);
      if (copySourceId) body.append("copy_source_id", copySourceId);
      if (image) {
        const webpImage = await convertImageToWebp(image);
        body.append("image", webpImage, webpImage.name);
      }
      const response = await fetch("/api/admin/webinars", {
        method: editingId ? "PUT" : "POST",
        body,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not add webinar");
      toast.success(
        editingId
          ? image
            ? "Webinar updated and new poster converted to WebP"
            : "Webinar updated"
          : copySourceId
            ? "Copied webinar published as a new active webinar"
            : "Webinar published and the previous webinar was completed"
      );
      resetForm();
      setShowForm(false);
      await refreshWebinarData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add webinar");
    } finally {
      setSaving(false);
    }
  };

  const selectImage = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Drop a valid image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Poster must be smaller than 10 MB");
      return;
    }

    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    setSelectedImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const startEditing = (webinar: Webinar) => {
    const localDate = webinar.starts_at
      ? formatIndiaDateTimeLocal(webinar.starts_at)
      : "";

    setEditingId(webinar.id);
    setCopySourceId(null);
    setForm({
      title: webinar.title,
      announcement_text: webinar.announcement_text,
      description: webinar.description,
      price_rupees: String(webinar.price_paise / 100),
      starts_at: localDate,
      whatsapp_group_url: webinar.whatsapp_group_url ?? "",
      free_registration_enabled: webinar.free_registration_enabled,
      free_slot_limit: String(webinar.free_slot_limit ?? 0),
      free_registration_starts_at: webinar.free_registration_starts_at
        ? formatIndiaDateTimeLocal(webinar.free_registration_starts_at)
        : "",
      free_registration_ends_at: webinar.free_registration_ends_at
        ? formatIndiaDateTimeLocal(webinar.free_registration_ends_at)
        : "",
    });
    setPreview(webinar.image_url);
    setSelectedImage(null);
    if (imageRef.current) imageRef.current.value = "";
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startCopying = (webinar: Webinar) => {
    setEditingId(null);
    setCopySourceId(webinar.id);
    setForm({
      title: webinar.title,
      announcement_text: webinar.announcement_text,
      description: webinar.description,
      price_rupees: String(webinar.price_paise / 100),
      starts_at: "",
      whatsapp_group_url: "",
      // A copy starts with a fresh free-slot allocation.
      free_registration_enabled: webinar.free_registration_enabled,
      free_slot_limit: String(webinar.free_slot_limit ?? 0),
      free_registration_starts_at: "",
      free_registration_ends_at: "",
    });
    setPreview(webinar.image_url);
    setSelectedImage(null);
    if (imageRef.current) imageRef.current.value = "";
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.info("Add the new date and WhatsApp link, then publish the copy");
  };

  const markCompleted = async (webinar: Webinar) => {
    if (
      !window.confirm(
        `Mark "${webinar.title}" as completed? It will stop showing on the public website, and all registrations will be preserved.`
      )
    ) {
      return;
    }

    setBusyId(webinar.id);
    try {
      const response = await fetch("/api/admin/webinars", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: webinar.id,
          is_visible: false,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not update webinar");
      toast.success("Webinar completed and hidden from the public website");
      await refreshWebinarData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (webinar: Webinar) => {
    if (
      !window.confirm(
        `Remove "${webinar.title}"? It will be hidden from the admin webinar list and public site, but its registrations and payment records will remain available in the webinar filter.`
      )
    ) {
      return;
    }

    setBusyId(webinar.id);
    try {
      const response = await fetch(
        `/api/admin/webinars?id=${encodeURIComponent(webinar.id)}`,
        { method: "DELETE" }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not remove webinar");
      toast.success("Webinar removed; registrations were preserved");
      await refreshWebinarData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Remove failed");
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="grid min-h-72 place-items-center text-center">
        <div>
          <Loader2 size={28} className="mx-auto animate-spin text-[#9B59D0]" />
          <p className="mt-3 text-sm text-white/40">Loading webinars...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="grid min-h-72 place-items-center text-center">
        <div className="max-w-sm">
          <p className="font-semibold text-white">Webinars could not load</p>
          <p className="mt-2 text-sm text-white/40">
            {error instanceof Error
              ? error.message
              : "Check your connection and try again."}
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-5 rounded-xl bg-[#9B59D0] px-5 py-2.5 text-sm font-bold text-white"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const webinars = data?.webinars ?? [];
  const listedWebinars = webinars.filter((webinar) => !webinar.deleted_at);
  const editingWebinar = editingId
    ? (webinars.find((webinar) => webinar.id === editingId) ?? null)
    : null;

  // Free seats already handed out can never be taken back, so the limit has a
  // hard floor. Warn while typing instead of failing on save.
  const claimedFreeSlots = editingWebinar?.free_slots_claimed ?? 0;
  const enteredFreeLimit = Number(form.free_slot_limit);
  const freeLimitBelowClaimed =
    claimedFreeSlots > 0 &&
    form.free_slot_limit.trim() !== "" &&
    Number.isFinite(enteredFreeLimit) &&
    enteredFreeLimit < claimedFreeSlots;
  const virtualRows = registrationVirtualizer.getVirtualItems();
  const virtualPaddingTop =
    virtualRows.length > 0 ? virtualRows[0].start : 0;
  const virtualPaddingBottom =
    virtualRows.length > 0
      ? registrationVirtualizer.getTotalSize() -
        virtualRows[virtualRows.length - 1].end
      : 0;

  const exportRegistrations = async () => {
    if (!data?.registration_total) {
      toast.error("There are no registrations to export for this filter");
      return;
    }

    setExporting(true);
    try {
      const params = new URLSearchParams({
        registration_export: "1",
        registration_webinar_id: registrationWebinarId,
      });
      const response = await fetch(`/api/admin/webinars?${params}`, {
        cache: "no-store",
        signal: AbortSignal.timeout(30_000),
      });
      const result = (await response.json()) as {
        registrations?: Registration[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(result.error || "Could not export registrations");
      }
      const exportRows = result.registrations ?? [];

    const columns = [
      "Registration ID",
      "Webinar",
      "Webinar removed",
      "Attendee name",
      "Email",
      "Phone",
      "Registration type",
      "Status",
      "Amount (INR)",
      "Payment ID",
      "Registered at",
      "Paid at",
    ];
    const rows = exportRows.map((registration) => {
      const webinar = webinars.find(
        (item) => item.id === registration.webinar_id
      );
      return [
        registration.id,
        webinar?.title ?? "Unknown webinar",
        webinar?.deleted_at ? "Yes" : "No",
        registration.form_data?.name ?? "",
        registration.form_data?.email ?? "",
        registration.form_data?.phone ?? "",
        registration.registration_type ?? "PAID",
        statusBadge(registration.status).label,
        registration.amount_paise === null
          ? ""
          : (registration.amount_paise / 100).toFixed(2),
        registration.razorpay_payment_id ?? "",
        new Date(
          registration.registered_at ?? registration.created_at
        ).toLocaleString("en-IN"),
        registration.paid_at
          ? new Date(registration.paid_at).toLocaleString("en-IN")
          : "",
      ];
    });
    const xmlRow = (cells: unknown[]) =>
      `<Row>${cells
        .map(
          (cell) =>
            `<Cell><Data ss:Type="String">${escapeSpreadsheetXml(cell)}</Data></Cell>`
        )
        .join("")}</Row>`;
    const workbook = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Header"><Font ss:Bold="1"/><Interior ss:Color="#9B59D0" ss:Pattern="Solid"/></Style>
 </Styles>
 <Worksheet ss:Name="Registrations">
  <Table>
   ${`<Row ss:StyleID="Header">${columns
     .map(
       (column) =>
         `<Cell><Data ss:Type="String">${escapeSpreadsheetXml(column)}</Data></Cell>`
     )
     .join("")}</Row>`}
   ${rows.map(xmlRow).join("")}
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <FreezePanes/><FrozenNoSplit/><SplitHorizontal>1</SplitHorizontal><TopRowBottomPane>1</TopRowBottomPane>
  </WorksheetOptions>
 </Worksheet>
</Workbook>`;

    const selectedWebinar = webinars.find(
      (webinar) => webinar.id === registrationWebinarId
    );
    const fileLabel = (selectedWebinar?.title ?? "all-webinars")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50);
    const blob = new Blob([workbook], {
      type: "application/vnd.ms-excel;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `webinar-registrations-${fileLabel || "export"}.xls`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
      toast.success(`Exported ${exportRows.length} registrations`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not export registrations"
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-black text-white">
            Webinars
          </h2>
          <p className="mt-1 text-sm text-white/45">
            Manage the announcement, timed popup, poster, price and registrations.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (showForm) {
              resetForm();
              setShowForm(false);
            } else {
              resetForm();
              setShowForm(true);
            }
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FBBF24] px-4 py-2.5 text-sm font-bold text-[#0F0B14] transition hover:bg-[#F59E0B]"
        >
          <Plus size={16} />
          {showForm ? "Close form" : "Add webinar"}
        </button>
      </div>

      {isFetching && (
        <div className="flex items-center gap-2 text-xs text-white/35">
          <Loader2 size={12} className="animate-spin" />
          Refreshing webinar details...
        </div>
      )}

      {showForm && (
        <form
          onSubmit={submit}
          className="grid gap-6 rounded-2xl border border-white/[0.08] bg-[#15111D]/70 p-5 lg:grid-cols-[1fr_280px]"
        >
          {copySourceId && (
            <div className="rounded-xl border border-[#9B59D0]/20 bg-[#9B59D0]/10 px-4 py-3 text-sm text-white/70 lg:col-span-2">
              This is a new webinar copied from a completed one. Add its new
              date and WhatsApp group link; publishing creates a new ID with
              zero registrations.
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 sm:col-span-2">
              <span className="text-xs uppercase tracking-wider text-white/45">
                Webinar title
              </span>
              <input
                required
                minLength={2}
                maxLength={120}
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({ ...current, title: event.target.value }))
                }
                className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm text-white outline-none focus:border-[#9B59D0]/70"
                placeholder="AI Growth Masterclass"
              />
            </label>
            <label className="space-y-2 sm:col-span-2">
              <span className="text-xs uppercase tracking-wider text-white/45">
                Top announcement message
              </span>
              <input
                required
                minLength={2}
                maxLength={180}
                value={form.announcement_text}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    announcement_text: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm text-white outline-none focus:border-[#9B59D0]/70"
                placeholder="New: Join our live AI growth webinar"
              />
            </label>
            <label className="space-y-2 sm:col-span-2">
              <span className="text-xs uppercase tracking-wider text-white/45">
                Popup description
              </span>
              <textarea
                required
                minLength={2}
                maxLength={2000}
                rows={4}
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                className="w-full resize-y rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm text-white outline-none focus:border-[#9B59D0]/70"
                placeholder="Tell visitors what they will learn and why they should attend."
              />
            </label>
            <label className="space-y-2 sm:col-span-2">
              <span className="text-xs uppercase tracking-wider text-white/45">
                WhatsApp group invite link
              </span>
              <input
                required
                type="url"
                value={form.whatsapp_group_url}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    whatsapp_group_url: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm text-white outline-none focus:border-[#9B59D0]/70"
                placeholder="https://chat.whatsapp.com/..."
              />
              <span className="block text-xs text-white/30">
                Revealed only to signed-in users who paid for this webinar.
              </span>
            </label>
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-wider text-white/45">
                Price (₹)
              </span>
              <input
                required
                type="number"
                min="1"
                step="0.01"
                value={form.price_rupees}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    price_rupees: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm text-white outline-none focus:border-[#9B59D0]/70"
                placeholder="499"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-wider text-white/45">
                Date & time in IST (optional)
              </span>
              <input
                type="datetime-local"
                value={form.starts_at}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    starts_at: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm text-white [color-scheme:dark] outline-none focus:border-[#9B59D0]/70"
              />
            </label>

            <fieldset className="space-y-4 rounded-2xl border border-[#9B59D0]/20 bg-[#9B59D0]/[0.05] p-4 sm:col-span-2">
              <legend className="px-1 text-xs font-bold uppercase tracking-wider text-[#C99BEE]">
                Free registration
              </legend>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={form.free_registration_enabled}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      free_registration_enabled: event.target.checked,
                      free_slot_limit:
                        event.target.checked && !current.free_slot_limit
                          ? "20"
                          : current.free_slot_limit,
                    }))
                  }
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#9B59D0]"
                />
                <span>
                  <span className="block text-sm font-semibold text-white">
                    Enable free registration
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-white/40">
                    The first attendees register free. Everyone after the limit
                    pays the price above.
                  </span>
                </span>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-wider text-white/45">
                    Number of free slots
                  </span>
                  <input
                    type="number"
                    min={claimedFreeSlots}
                    step="1"
                    value={form.free_slot_limit}
                    aria-invalid={freeLimitBelowClaimed}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        free_slot_limit: event.target.value,
                      }))
                    }
                    className={`w-full rounded-xl border bg-black/25 px-3 py-2.5 text-sm text-white outline-none ${
                      freeLimitBelowClaimed
                        ? "border-red-400/60 focus:border-red-400"
                        : "border-white/10 focus:border-[#9B59D0]/70"
                    }`}
                    placeholder="20"
                  />
                  {freeLimitBelowClaimed ? (
                    <span className="flex items-start gap-1.5 text-xs font-semibold leading-5 text-red-300">
                      <TriangleAlert size={13} className="mt-0.5 shrink-0" />
                      <span>
                        {claimedFreeSlots} free{" "}
                        {claimedFreeSlots === 1 ? "seat is" : "seats are"}{" "}
                        already confirmed, so the lowest you can set is{" "}
                        {claimedFreeSlots}. To stop new free seats, untick
                        &ldquo;Enable free registration&rdquo; instead — the{" "}
                        {claimedFreeSlots} already registered keep theirs.
                      </span>
                    </span>
                  ) : (
                    editingWebinar && (
                      <span className="block text-xs text-white/35">
                        {claimedFreeSlots} free{" "}
                        {claimedFreeSlots === 1 ? "seat" : "seats"} claimed so
                        far. The limit can be raised any time, but not lowered
                        below {claimedFreeSlots}.
                      </span>
                    )
                  )}
                </label>
                <div className="hidden sm:block" />
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-wider text-white/45">
                    Free registration starts (IST, optional)
                  </span>
                  <input
                    type="datetime-local"
                    value={form.free_registration_starts_at}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        free_registration_starts_at: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm text-white [color-scheme:dark] outline-none focus:border-[#9B59D0]/70"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-wider text-white/45">
                    Free registration ends (IST, optional)
                  </span>
                  <input
                    type="datetime-local"
                    value={form.free_registration_ends_at}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        free_registration_ends_at: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm text-white [color-scheme:dark] outline-none focus:border-[#9B59D0]/70"
                  />
                </label>
              </div>
            </fieldset>

            <div className="flex gap-3 sm:col-span-2">
              <button
                type="submit"
                disabled={saving || freeLimitBelowClaimed}
                className="inline-flex items-center gap-2 rounded-xl bg-[#9B59D0] px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                {saving
                  ? "Converting & saving..."
                  : editingId
                    ? "Save changes"
                    : copySourceId
                      ? "Publish copied webinar"
                    : "Publish webinar"}
              </button>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/60 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>

          <label
            className={`group relative min-h-64 cursor-pointer overflow-hidden rounded-2xl border border-dashed bg-black/25 transition-all ${
              isDragging
                ? "scale-[1.01] border-[#9B59D0] bg-[#9B59D0]/10 shadow-[0_0_35px_rgba(155,89,208,0.16)]"
                : "border-white/15 hover:border-[#9B59D0]/60"
            }`}
            onDragEnter={(event) => {
              event.preventDefault();
              dragDepth.current += 1;
              setIsDragging(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "copy";
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              dragDepth.current = Math.max(0, dragDepth.current - 1);
              if (dragDepth.current === 0) setIsDragging(false);
            }}
            onDrop={(event) => {
              event.preventDefault();
              dragDepth.current = 0;
              setIsDragging(false);
              selectImage(event.dataTransfer.files?.[0]);
            }}
          >
            <input
              ref={imageRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => {
                selectImage(event.target.files?.[0]);
              }}
            />
            {preview ? (
              <>
                <img src={preview} alt="Poster preview" className="h-full w-full object-cover" />
                <div className="absolute inset-x-3 bottom-3 rounded-lg bg-black/75 px-3 py-2 text-center text-xs text-white backdrop-blur">
                  Click to {editingId || copySourceId ? "replace" : "change"} poster
                </div>
              </>
            ) : (
              <div className="absolute inset-0 grid place-items-center p-6 text-center">
                <div>
                  <ImagePlus size={30} className="mx-auto mb-3 text-[#9B59D0]" />
                  <div className="text-sm font-semibold text-white">
                    {isDragging ? "Drop poster here" : "Choose or drop poster"}
                  </div>
                  <div className="mt-1 text-xs leading-5 text-white/35">
                    JPG, PNG, AVIF or WebP up to 10 MB.
                    <br />
                    Converted locally, then saved to Supabase as WebP.
                  </div>
                </div>
              </div>
            )}
          </label>
        </form>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {listedWebinars.map((webinar) => {
          return (
            <article
              key={webinar.id}
              className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#15111D]/65"
            >
              <div className="grid grid-cols-[120px_1fr]">
                <img
                  src={webinar.image_url}
                  alt=""
                  className="h-full min-h-44 w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <div className="min-w-0 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        webinar.is_visible
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-white/5 text-white/35"
                      }`}
                    >
                      {webinar.is_visible
                        ? "Active / Showing"
                        : "Completed / Hidden"}
                    </span>
                  </div>
                  <h3 className="truncate font-display text-lg font-bold text-white">
                    {webinar.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/40">
                    {webinar.announcement_text}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-white/55">
                    <span className="font-bold text-[#FBBF24]">
                      {formatPrice(webinar.price_paise)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users size={12} />
                      {webinar.registration_total} enrolled
                    </span>
                    {webinar.starts_at && (
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays size={12} />
                        {formatIndiaDateTime(webinar.starts_at)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-px border-t border-white/[0.05] bg-white/[0.04] sm:grid-cols-4">
                <Stat
                  label="Free registrations"
                  value={
                    webinar.free_registration_enabled
                      ? `${webinar.free_registration_count} / ${webinar.free_slot_limit}`
                      : "Off"
                  }
                  hint={
                    webinar.free_registration_enabled
                      ? `${webinar.free_slots_remaining} remaining · ${webinar.free_slots_claimed} claimed`
                      : "Free registration disabled"
                  }
                  tone={
                    !webinar.free_registration_enabled
                      ? "muted"
                      : webinar.free_slots_remaining === 0
                        ? "danger"
                        : webinar.free_slots_remaining <= 5
                          ? "warning"
                          : "success"
                  }
                />
                <Stat
                  label="Paid registrations"
                  value={String(webinar.paid_registration_count)}
                  hint="Confirmed payments"
                  tone="success"
                />
                <Stat
                  label="Payment pending"
                  value={String(webinar.pending_registration_count)}
                  hint="Checkout not completed"
                  tone={
                    webinar.pending_registration_count > 0 ? "warning" : "muted"
                  }
                />
                <Stat
                  label="Total enrolled"
                  value={String(
                    webinar.free_registration_count +
                      webinar.paid_registration_count
                  )}
                  hint="Free + paid confirmed"
                  tone="muted"
                />
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-white/[0.05] p-3">
                {webinar.is_visible ? (
                  <>
                    <button
                      type="button"
                      disabled={busyId === webinar.id}
                      onClick={() => startEditing(webinar)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/60 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={busyId === webinar.id}
                      onClick={() => markCompleted(webinar)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/60 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
                    >
                      <CheckCircle2 size={14} />
                      Mark completed
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={busyId === webinar.id}
                    onClick={() => startCopying(webinar)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/60 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
                  >
                    <Copy size={14} />
                    Copy as new
                  </button>
                )}
                <button
                  type="button"
                  disabled={busyId === webinar.id}
                  onClick={() => remove(webinar)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-400/15 px-3 py-2 text-xs text-red-300/70 transition hover:bg-red-400/5 hover:text-red-300 disabled:opacity-40"
                >
                  <Trash2 size={14} />
                  Remove
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {listedWebinars.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center text-sm text-white/35">
          No webinars yet. The public site remains exactly as it is now.
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#15111D]/50">
        <div className="flex flex-col gap-3 border-b border-white/[0.06] px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="font-display font-bold text-white">
              Webinar registrations
            </h3>
            <span className="text-xs text-white/35">
              {registrations.length} on this page /{" "}
              {data?.registration_total ?? 0} total
            </span>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select
              value={registrationWebinarId}
              onValueChange={(value) => {
                setRegistrationWebinarId(value);
                setRegistrationPage(1);
              }}
            >
              <SelectTrigger
                aria-label="Filter registrations by webinar"
                className="h-10 w-full min-w-64 border-white/10 bg-black/25 text-white sm:w-80"
              >
                <SelectValue placeholder="Choose a webinar" />
              </SelectTrigger>
              <SelectContent
                data-lenis-prevent
                className="max-h-64 overflow-y-auto border-white/10 bg-[#1A1525] text-white"
              >
                <SelectItem
                  value="all"
                  className="focus:bg-white/10 focus:text-white"
                >
                  All webinars
                </SelectItem>
                {webinars.map((webinar) => (
                  <SelectItem
                    key={webinar.id}
                    value={webinar.id}
                    className="focus:bg-white/10 focus:text-white"
                  >
                    {webinar.title}
                    {webinar.deleted_at ? " (Removed)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              type="button"
              disabled={!data?.registration_total || exporting}
              onClick={() => void exportRegistrations()}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 text-sm font-bold text-[#08130d] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {exporting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              {exporting ? "Exporting..." : "Export Excel"}
            </button>
          </div>
        </div>
        <div
          ref={registrationTableRef}
          className="max-h-[520px] overflow-auto"
        >
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-[#15111D] text-[11px] uppercase tracking-wider text-white/30">
              <tr>
                <th className="px-4 py-3 font-medium">Attendee</th>
                <th className="px-4 py-3 font-medium">Webinar</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {virtualPaddingTop > 0 && (
                <tr aria-hidden="true">
                  <td colSpan={6} style={{ height: virtualPaddingTop }} />
                </tr>
              )}
              {virtualRows.map((virtualRow) => {
                const registration = registrations[virtualRow.index];
                return (
                <tr
                  key={registration.id}
                  ref={registrationVirtualizer.measureElement}
                  data-index={virtualRow.index}
                  className="border-t border-white/[0.04]"
                >
                  <td className="px-4 py-3">
                    <div className="text-white/80">
                      {registration.form_data?.name || "—"}
                    </div>
                    <div className="text-xs text-white/35">
                      {registration.form_data?.email || "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-white/55">
                    {webinars.find(
                      (webinar) => webinar.id === registration.webinar_id
                    )?.title || "Webinar"}
                    {webinars.find(
                      (webinar) => webinar.id === registration.webinar_id
                    )?.deleted_at && (
                      <span className="ml-2 rounded bg-red-400/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-red-300/70">
                        Removed
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-white/50">
                    {registration.form_data?.phone || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-[11px] font-bold uppercase tracking-wide ${
                        registration.registration_type === "FREE"
                          ? "bg-[#9B59D0]/12 text-[#C99BEE]"
                          : "bg-white/5 text-white/45"
                      }`}
                    >
                      {registration.registration_type === "FREE"
                        ? "Free"
                        : "Paid"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${statusBadge(registration.status).className}`}
                    >
                      {statusBadge(registration.status).label}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-white/40">
                    {new Date(
                      registration.registered_at ?? registration.created_at
                    ).toLocaleDateString("en-IN")}
                  </td>
                </tr>
                );
              })}
              {virtualPaddingBottom > 0 && (
                <tr aria-hidden="true">
                  <td colSpan={6} style={{ height: virtualPaddingBottom }} />
                </tr>
              )}
            </tbody>
          </table>
          {registrations.length === 0 && (
            <div className="py-12 text-center text-sm text-white/30">
              No webinar registrations for this filter.
            </div>
          )}
        </div>
        {(data?.registration_total_pages ?? 0) > 1 && (
          <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-3 text-sm">
            <span className="text-white/40">
              Page {registrationPage} of {data?.registration_total_pages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setRegistrationPage((page) => Math.max(1, page - 1))
                }
                disabled={registrationPage <= 1 || isFetching}
                className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-white/60 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronLeft size={14} />
                Prev
              </button>
              <button
                type="button"
                onClick={() =>
                  setRegistrationPage((page) =>
                    Math.min(data?.registration_total_pages ?? page, page + 1)
                  )
                }
                disabled={
                  registrationPage >= (data?.registration_total_pages ?? 0) ||
                  isFetching
                }
                className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-white/60 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
