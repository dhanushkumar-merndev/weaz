import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import sharp from "sharp";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { ACTIVE_WEBINAR_CACHE_TAG } from "@/lib/active-webinar";
import { isTrustedBrowserRequest } from "@/lib/payment-security";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

const BUCKET = "webinar-posters";
const MAX_SOURCE_BYTES = 10 * 1024 * 1024;

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

function invalidateActiveWebinarCache() {
  revalidateTag(ACTIVE_WEBINAR_CACHE_TAG, { expire: 0 });
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

  const supabase = getSupabaseAdmin();
  const signal = AbortSignal.timeout(12_000);
  const [
    { data: webinars, error },
    { data: registrations, error: registrationsError },
  ] = await Promise.all([
    supabase
      .from("webinars")
      .select("*")
      .order("created_at", { ascending: false })
      .abortSignal(signal),
    supabase
      .from("webinar_registrations")
      .select(
        "id, webinar_id, status, form_data, paid_at, created_at, razorpay_payment_id"
      )
      .order("created_at", { ascending: false })
      .abortSignal(signal),
  ]);

  if (error || registrationsError) {
    console.error(
      "Admin webinar loading failed",
      error?.message ?? registrationsError?.message
    );
    return errorResponse("Could not load webinars. Please retry.", 503);
  }

  const withUrls = (webinars ?? []).map((webinar) => ({
    ...webinar,
    image_url: supabase.storage
      .from(BUCKET)
      .getPublicUrl(webinar.image_path).data.publicUrl,
  }));

  return NextResponse.json(
    { webinars: withUrls, registrations: registrations ?? [] },
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

  if (!title || !announcementText || !description || !whatsappGroupUrl) {
    return errorResponse(
      "Complete all fields with a valid WhatsApp group invite link",
      400
    );
  }
  if (!Number.isFinite(priceRupees) || priceRupees <= 0 || priceRupees > 10_000_000) {
    return errorResponse("Enter a valid webinar price", 400);
  }
  if (!(source instanceof File) || !source.type.startsWith("image/")) {
    return errorResponse("Choose a valid poster image", 400);
  }
  if (source.size <= 0 || source.size > MAX_SOURCE_BYTES) {
    return errorResponse("Poster must be smaller than 10 MB", 400);
  }

  let startsAt: string | null = null;
  if (typeof startsAtValue === "string" && startsAtValue.trim()) {
    const date = new Date(startsAtValue);
    if (Number.isNaN(date.getTime())) {
      return errorResponse("Enter a valid webinar date", 400);
    }
    startsAt = date.toISOString();
  }

  let webp: Buffer;
  try {
    webp = await sharp(Buffer.from(await source.arrayBuffer()))
      .rotate()
      .resize(1600, 1600, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 84, effort: 5 })
      .toBuffer();
  } catch {
    return errorResponse("The uploaded image could not be processed", 400);
  }

  const supabase = getSupabaseAdmin();
  const imagePath = `${new Date().getUTCFullYear()}/${randomUUID()}.webp`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(imagePath, webp, {
      contentType: "image/webp",
      cacheControl: "31536000",
      upsert: false,
    });

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

  const { error: activationError } = await supabase.rpc("activate_webinar", {
    target_webinar_id: data.id,
  });
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
    const { error } = await supabase.rpc("activate_webinar", {
      target_webinar_id: body.id,
    });
    if (error) return errorResponse("Webinar not found", 404);

    const { data } = await supabase
      .from("webinars")
      .select()
      .eq("id", body.id)
      .maybeSingle();
    if (!data) return errorResponse("Webinar not found", 404);
    invalidateActiveWebinarCache();
    return NextResponse.json({ webinar: data });
  }

  const { data, error } = await supabase
    .from("webinars")
    .update({ is_visible: false, updated_at: new Date().toISOString() })
    .eq("id", body.id)
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
    const date = new Date(startsAtValue);
    if (Number.isNaN(date.getTime())) {
      return errorResponse("Enter a valid webinar date", 400);
    }
    startsAt = date.toISOString();
  }

  const supabase = getSupabaseAdmin();
  const { data: existing } = await supabase
    .from("webinars")
    .select("image_path")
    .eq("id", id)
    .maybeSingle();
  if (!existing) return errorResponse("Webinar not found", 404);

  let replacementPath: string | null = null;
  if (source instanceof File && source.size > 0) {
    if (!source.type.startsWith("image/") || source.size > MAX_SOURCE_BYTES) {
      return errorResponse("Choose a valid poster smaller than 10 MB", 400);
    }

    let webp: Buffer;
    try {
      webp = await sharp(Buffer.from(await source.arrayBuffer()))
        .rotate()
        .resize(1600, 1600, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 84, effort: 5 })
        .toBuffer();
    } catch {
      return errorResponse("The uploaded image could not be processed", 400);
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
  const { count } = await supabase
    .from("webinar_registrations")
    .select("id", { count: "exact", head: true })
    .eq("webinar_id", id);

  if ((count ?? 0) > 0) {
    return errorResponse(
      "This webinar has registrations. Hide it to preserve payment records.",
      409
    );
  }

  const { data: webinar } = await supabase
    .from("webinars")
    .select("image_path")
    .eq("id", id)
    .maybeSingle();
  if (!webinar) return errorResponse("Webinar not found", 404);

  const { error } = await supabase.from("webinars").delete().eq("id", id);
  if (error) return errorResponse("Could not remove the webinar", 500);

  const { error: imageError } = await supabase.storage
    .from(BUCKET)
    .remove([webinar.image_path]);
  if (imageError) {
    console.error("Deleted webinar poster cleanup failed", imageError.message);
  }

  invalidateActiveWebinarCache();
  return NextResponse.json({ success: true });
}
