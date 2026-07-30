import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { ACTIVE_WEBINAR_CACHE_TAG } from "@/lib/webinar-cache";
import {
  isEnrollmentId,
  isTrustedBrowserRequest,
} from "@/lib/payment-security";
import { getSupabaseAdmin } from "@/lib/supabase";
import { parseIndiaDateTimeLocal } from "@/lib/india-time";

export const runtime = "nodejs";

const BUCKET = "webinar-posters";
const REGISTRATION_SELECT =
  "id, webinar_id, status, amount_paise, form_data, paid_at, created_at, razorpay_payment_id";

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

function invalidateActiveWebinarCache() {
  revalidateTag(ACTIVE_WEBINAR_CACHE_TAG, { expire: 0 });
}

async function loadRegistrationCounts(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  webinarIds: string[]
) {
  const { data, error } = await supabase.rpc(
    "get_webinar_registration_counts",
    {}
  );
  if (!error) {
    return new Map(
      (data ?? []).map((row) => [
        row.webinar_id,
        {
          total: Number(row.total_count),
          paid: Number(row.paid_count),
        },
      ])
    );
  }

  // Keep the admin usable while the aggregate-count migration is rolling out.
  console.warn(
    "Falling back to individual webinar registration counts; apply the latest Supabase migration",
    error.message
  );
  const countRows = await Promise.all(
    webinarIds.map(async (webinarId) => {
      const [totalResult, paidResult] = await Promise.all([
        supabase
          .from("webinar_registrations")
          .select("id", { count: "exact", head: true })
          .eq("webinar_id", webinarId),
        supabase
          .from("webinar_registrations")
          .select("id", { count: "exact", head: true })
          .eq("webinar_id", webinarId)
          .eq("status", "paid"),
      ]);
      if (totalResult.error || paidResult.error) {
        throw totalResult.error ?? paidResult.error;
      }
      return [
        webinarId,
        {
          total: totalResult.count ?? 0,
          paid: paidResult.count ?? 0,
        },
      ] as const;
    })
  );
  return new Map(countRows);
}

async function activateWebinar(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  webinarId: string
) {
  const { error: rpcError } = await supabase.rpc("activate_webinar", {
    target_webinar_id: webinarId,
  });
  if (!rpcError) return null;

  // This keeps publishing functional while the corrective database migration is
  // rolling out to an environment that still has the old unscoped RPC.
  if (!rpcError.message.toLowerCase().includes("requires a where clause")) {
    return rpcError;
  }

  console.warn(
    "Falling back to scoped webinar activation; apply the latest Supabase migration",
    rpcError.message
  );

  const { error: hideError } = await supabase
    .from("webinars")
    .update({ is_visible: false, updated_at: new Date().toISOString() })
    .eq("is_visible", true)
    .is("deleted_at", null)
    .neq("id", webinarId);
  if (hideError) return hideError;

  const { data, error: showError } = await supabase
    .from("webinars")
    .update({ is_visible: true, updated_at: new Date().toISOString() })
    .eq("id", webinarId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (showError) return showError;
  if (!data) return { message: "Webinar not found" };
  return null;
}

async function readVerifiedWebp(source: File) {
  if (
    source.type !== "image/webp" ||
    source.size <= 0 ||
    source.size > 5 * 1024 * 1024
  ) {
    throw new Error("Poster must be a WebP file smaller than 5 MB");
  }

  const buffer = Buffer.from(await source.arrayBuffer());
  const isWebp =
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP";
  if (!isWebp) throw new Error("Poster has an invalid WebP signature");
  return buffer;
}

function parseRequiredText(value: FormDataEntryValue | null, max: number) {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text.length >= 2 && text.length <= max ? text : null;
}

function parseWhatsAppGroupUrl(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value.trim());
    if (
      url.protocol !== "https:" ||
      url.hostname !== "chat.whatsapp.com" ||
      url.pathname.split("/").filter(Boolean).length !== 1
    ) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  if (!(await getAdminFromRequest(request))) {
    return errorResponse("Forbidden", 403);
  }

  const searchParams = new URL(request.url).searchParams;
  const registrationWebinarId = searchParams.get("registration_webinar_id");
  if (
    registrationWebinarId &&
    registrationWebinarId !== "all" &&
    !isEnrollmentId(registrationWebinarId)
  ) {
    return errorResponse("Invalid webinar filter", 400);
  }

  const supabase = getSupabaseAdmin();
  const filterId =
    registrationWebinarId && registrationWebinarId !== "all"
      ? registrationWebinarId
      : null;

  if (searchParams.get("registration_export") === "1") {
    const registrations = [];
    const batchSize = 1_000;
    for (let offset = 0; ; offset += batchSize) {
      let query = supabase
        .from("webinar_registrations")
        .select(REGISTRATION_SELECT)
        .order("created_at", { ascending: false });
      if (filterId) query = query.eq("webinar_id", filterId);
      const { data, error } = await query.range(
        offset,
        offset + batchSize - 1
      );
      if (error) {
        console.error("Webinar registration export failed", error.message);
        return errorResponse("Could not export registrations", 503);
      }
      registrations.push(...(data ?? []));
      if (!data || data.length < batchSize) break;
    }
    return NextResponse.json(
      { registrations },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const registrationPage = Math.max(
    1,
    Number.parseInt(searchParams.get("registration_page") ?? "1", 10) || 1
  );
  const registrationLimit = Math.min(
    100,
    Math.max(
      1,
      Number.parseInt(searchParams.get("registration_limit") ?? "50", 10) ||
        50
    )
  );
  const registrationOffset = (registrationPage - 1) * registrationLimit;
  const signal = AbortSignal.timeout(12_000);
  const webinarsResult = await supabase
    .from("webinars")
    .select("*")
    .order("created_at", { ascending: false })
    .abortSignal(signal);
  const { data: webinars, error } = webinarsResult;
  if (error) {
    console.error("Admin webinar loading failed", error.message);
    return errorResponse("Could not load webinars. Please retry.", 503);
  }

  let registrationsQuery = supabase
    .from("webinar_registrations")
    .select(REGISTRATION_SELECT, { count: "exact" })
    .order("created_at", { ascending: false });
  if (filterId) {
    registrationsQuery = registrationsQuery.eq("webinar_id", filterId);
  }

  const [
    {
      data: registrations,
      error: registrationsError,
      count: registrationTotal,
    },
    registrationCounts,
  ] = await Promise.all([
    registrationsQuery
      .range(
        registrationOffset,
        registrationOffset + registrationLimit - 1
      )
      .abortSignal(signal),
    loadRegistrationCounts(
      supabase,
      (webinars ?? []).map((webinar) => webinar.id)
    ),
  ]);

  if (registrationsError) {
    console.error(
      "Admin webinar loading failed",
      registrationsError.message
    );
    return errorResponse("Could not load webinars. Please retry.", 503);
  }

  const withUrls = (webinars ?? []).map((webinar) => ({
    ...webinar,
    registration_total: registrationCounts.get(webinar.id)?.total ?? 0,
    paid_registration_count: registrationCounts.get(webinar.id)?.paid ?? 0,
    image_url: supabase.storage
      .from(BUCKET)
      .getPublicUrl(webinar.image_path).data.publicUrl,
  }));
  const total = registrationTotal ?? 0;

  return NextResponse.json(
    {
      webinars: withUrls,
      registrations: registrations ?? [],
      registration_page: registrationPage,
      registration_limit: registrationLimit,
      registration_total: total,
      registration_total_pages: total
        ? Math.ceil(total / registrationLimit)
        : 0,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  if (!isTrustedBrowserRequest(request)) {
    return errorResponse("Cross-site request rejected", 403);
  }
  if (!(await getAdminFromRequest(request))) {
    return errorResponse("Forbidden", 403);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse("Invalid form data", 400);
  }

  const title = parseRequiredText(formData.get("title"), 120);
  const announcementText = parseRequiredText(
    formData.get("announcement_text"),
    180
  );
  const description = parseRequiredText(formData.get("description"), 2000);
  const whatsappGroupUrl = parseWhatsAppGroupUrl(
    formData.get("whatsapp_group_url")
  );
  const priceRupees = Number(formData.get("price_rupees"));
  const startsAtValue = formData.get("starts_at");
  const source = formData.get("image");
  const copySourceId = formData.get("copy_source_id");

  if (!title || !announcementText || !description || !whatsappGroupUrl) {
    return errorResponse(
      "Complete all fields with a valid WhatsApp group invite link",
      400
    );
  }
  if (!Number.isFinite(priceRupees) || priceRupees <= 0 || priceRupees > 10_000_000) {
    return errorResponse("Enter a valid webinar price", 400);
  }
  const hasUploadedPoster = source instanceof File && source.size > 0;
  const hasCopySource =
    typeof copySourceId === "string" && isEnrollmentId(copySourceId);
  if (!hasUploadedPoster && !hasCopySource) {
    return errorResponse("Choose a valid poster image", 400);
  }

  let startsAt: string | null = null;
  if (typeof startsAtValue === "string" && startsAtValue.trim()) {
    startsAt = parseIndiaDateTimeLocal(startsAtValue);
    if (!startsAt) {
      return errorResponse("Enter a valid webinar date", 400);
    }
  }

  const supabase = getSupabaseAdmin();
  const imagePath = `${new Date().getUTCFullYear()}/${randomUUID()}.webp`;
  let uploadError: { message: string } | null = null;

  if (hasUploadedPoster) {
    let webp: Buffer;
    try {
      webp = await readVerifiedWebp(source);
    } catch (error) {
      return errorResponse(
        error instanceof Error ? error.message : "Invalid WebP poster",
        400
      );
    }
    const uploadResult = await supabase.storage
      .from(BUCKET)
      .upload(imagePath, webp, {
        contentType: "image/webp",
        cacheControl: "31536000",
        upsert: false,
      });
    uploadError = uploadResult.error;
  } else {
    const { data: copySource } = await supabase
      .from("webinars")
      .select("image_path")
      .eq("id", copySourceId as string)
      .eq("is_visible", false)
      .is("deleted_at", null)
      .maybeSingle();
    if (!copySource) {
      return errorResponse("Completed webinar copy source not found", 404);
    }
    const copyResult = await supabase.storage
      .from(BUCKET)
      .copy(copySource.image_path, imagePath);
    uploadError = copyResult.error;
  }

  if (uploadError) {
    console.error("Webinar poster upload failed", uploadError.message);
    return errorResponse("Could not upload the webinar poster", 500);
  }

  const { data, error } = await supabase
    .from("webinars")
    .insert({
      title,
      announcement_text: announcementText,
      description,
      price_paise: Math.round(priceRupees * 100),
      image_path: imagePath,
      whatsapp_group_url: whatsappGroupUrl,
      starts_at: startsAt,
      is_visible: false,
    })
    .select()
    .single();

  if (error) {
    await supabase.storage.from(BUCKET).remove([imagePath]);
    console.error("Webinar creation failed", error.message);
    return errorResponse("Could not create the webinar", 500);
  }

  const activationError = await activateWebinar(supabase, data.id);
  if (activationError) {
    await supabase.from("webinars").delete().eq("id", data.id);
    await supabase.storage.from(BUCKET).remove([imagePath]);
    console.error("New webinar activation failed", activationError.message);
    return errorResponse("Could not publish the webinar", 500);
  }

  invalidateActiveWebinarCache();
  return NextResponse.json(
    { webinar: { ...data, is_visible: true } },
    { status: 201 }
  );
}

export async function PATCH(request: Request) {
  if (!isTrustedBrowserRequest(request)) {
    return errorResponse("Cross-site request rejected", 403);
  }
  if (!(await getAdminFromRequest(request))) {
    return errorResponse("Forbidden", 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("id" in body) ||
    typeof body.id !== "string" ||
    !("is_visible" in body) ||
    typeof body.is_visible !== "boolean"
  ) {
    return errorResponse("Invalid webinar update", 400);
  }

  const supabase = getSupabaseAdmin();
  if (body.is_visible) {
    return errorResponse(
      "Completed webinars must be copied as a new webinar",
      409
    );
  }

  const { data, error } = await supabase
    .from("webinars")
    .update({ is_visible: false, updated_at: new Date().toISOString() })
    .eq("id", body.id)
    .eq("is_visible", true)
    .is("deleted_at", null)
    .select()
    .maybeSingle();
  if (error || !data) return errorResponse("Webinar not found", 404);
  invalidateActiveWebinarCache();
  return NextResponse.json({ webinar: data });
}

export async function PUT(request: Request) {
  if (!isTrustedBrowserRequest(request)) {
    return errorResponse("Cross-site request rejected", 403);
  }
  if (!(await getAdminFromRequest(request))) {
    return errorResponse("Forbidden", 403);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse("Invalid form data", 400);
  }

  const id = formData.get("id");
  const title = parseRequiredText(formData.get("title"), 120);
  const announcementText = parseRequiredText(
    formData.get("announcement_text"),
    180
  );
  const description = parseRequiredText(formData.get("description"), 2000);
  const whatsappGroupUrl = parseWhatsAppGroupUrl(
    formData.get("whatsapp_group_url")
  );
  const priceRupees = Number(formData.get("price_rupees"));
  const startsAtValue = formData.get("starts_at");
  const source = formData.get("image");

  if (
    typeof id !== "string" ||
    !id ||
    !title ||
    !announcementText ||
    !description ||
    !whatsappGroupUrl
  ) {
    return errorResponse(
      "Complete all fields with a valid WhatsApp group invite link",
      400
    );
  }
  if (
    !Number.isFinite(priceRupees) ||
    priceRupees <= 0 ||
    priceRupees > 10_000_000
  ) {
    return errorResponse("Enter a valid webinar price", 400);
  }

  let startsAt: string | null = null;
  if (typeof startsAtValue === "string" && startsAtValue.trim()) {
    startsAt = parseIndiaDateTimeLocal(startsAtValue);
    if (!startsAt) {
      return errorResponse("Enter a valid webinar date", 400);
    }
  }

  const supabase = getSupabaseAdmin();
  const { data: existing } = await supabase
    .from("webinars")
    .select("image_path")
    .eq("id", id)
    .eq("is_visible", true)
    .is("deleted_at", null)
    .maybeSingle();
  if (!existing) return errorResponse("Webinar not found", 404);

  let replacementPath: string | null = null;
  if (source instanceof File && source.size > 0) {
    let webp: Buffer;
    try {
      webp = await readVerifiedWebp(source);
    } catch (error) {
      return errorResponse(
        error instanceof Error ? error.message : "Invalid WebP poster",
        400
      );
    }

    replacementPath = `${new Date().getUTCFullYear()}/${randomUUID()}.webp`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(replacementPath, webp, {
        contentType: "image/webp",
        cacheControl: "31536000",
        upsert: false,
      });
    if (uploadError) {
      console.error("Replacement poster upload failed", uploadError.message);
      return errorResponse("Could not upload the new poster", 500);
    }
  }

  const { data, error } = await supabase
    .from("webinars")
    .update({
      title,
      announcement_text: announcementText,
      description,
      price_paise: Math.round(priceRupees * 100),
      whatsapp_group_url: whatsappGroupUrl,
      starts_at: startsAt,
      image_path: replacementPath ?? existing.image_path,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("is_visible", true)
    .is("deleted_at", null)
    .select()
    .single();

  if (error) {
    if (replacementPath) {
      await supabase.storage.from(BUCKET).remove([replacementPath]);
    }
    return errorResponse("Could not update the webinar", 500);
  }

  if (replacementPath && replacementPath !== existing.image_path) {
    const { error: cleanupError } = await supabase.storage
      .from(BUCKET)
      .remove([existing.image_path]);
    if (cleanupError) {
      console.error("Old webinar poster cleanup failed", cleanupError.message);
    }
  }

  invalidateActiveWebinarCache();
  return NextResponse.json({ webinar: data });
}

export async function DELETE(request: Request) {
  if (!isTrustedBrowserRequest(request)) {
    return errorResponse("Cross-site request rejected", 403);
  }
  if (!(await getAdminFromRequest(request))) {
    return errorResponse("Forbidden", 403);
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return errorResponse("Missing webinar id", 400);

  const supabase = getSupabaseAdmin();
  const deletedAt = new Date().toISOString();
  const { data: webinar, error } = await supabase
    .from("webinars")
    .update({
      is_visible: false,
      deleted_at: deletedAt,
      updated_at: deletedAt,
    })
    .eq("id", id)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();
  if (error) return errorResponse("Could not remove the webinar", 500);
  if (!webinar) return errorResponse("Webinar not found", 404);

  invalidateActiveWebinarCache();
  return NextResponse.json({ success: true, deleted_at: deletedAt });
}
