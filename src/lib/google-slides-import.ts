import "server-only";

import type { CourseSlide } from "@/lib/course-types";
import { readPptxText } from "@/lib/pptx-text";

// Reads a Google Slides deck by downloading its .pptx export. Google serves
// that export without sign-in only for decks shared as "Anyone with the link",
// so a successful read also proves students can open the embedded deck.

export type GoogleSlidesErrorCode =
  | "not-public"
  | "not-found"
  | "too-large"
  | "unreadable"
  | "empty"
  | "failed";

const MAX_DOWNLOAD_MB = 50;

const ERROR_MESSAGES: Record<GoogleSlidesErrorCode, string> = {
  "not-public":
    "This deck isn't shared publicly. In Google Slides, set Share → General access → Anyone with the link · Viewer.",
  "not-found": "Google couldn't find this deck. Check the link.",
  "too-large": `This deck is larger than ${MAX_DOWNLOAD_MB} MB. Remove large images or videos and try again.`,
  unreadable: "Google returned a file that couldn't be read as slides.",
  empty: "This deck has no slides.",
  failed: "Couldn't download the deck from Google. Try again.",
};

export class GoogleSlidesError extends Error {
  readonly code: GoogleSlidesErrorCode;

  constructor(code: GoogleSlidesErrorCode) {
    super(ERROR_MESSAGES[code]);
    this.name = "GoogleSlidesError";
    this.code = code;
  }
}

const PPTX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation";
const MAX_DOWNLOAD_BYTES = MAX_DOWNLOAD_MB * 1024 * 1024;
const LIMITS = { slides: 150, title: 200, points: 20, point: 400, description: 3000 };

const clip = (value: string, max: number) =>
  value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;

export const PUBLIC_EDIT_ACCESS_MESSAGE =
  "Anyone with this link can edit these slides. In Google Slides set Share → Anyone with the link → Viewer, then try again.";

/**
 * Whether anyone with the link can edit the deck, read from the page Google
 * shows a signed-out visitor: view-only access shows an access-level
 * indicator, edit access shows the editing menus. Returns null when the page
 * shows neither (for example if Google changes it) or can't be loaded.
 */
export async function checkPublicEditAccess(presentationId: string): Promise<boolean | null> {
  try {
    const response = await fetch(
      `https://docs.google.com/presentation/d/${encodeURIComponent(presentationId)}/edit`,
      {
        cache: "no-store",
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(15_000),
      }
    );
    if (!response.ok) return null;
    const html = await response.text();
    if (html.includes('id="docs-access-level-indicator"')) return false;
    if (html.includes('id="docs-insert-menu"')) return true;
    return null;
  } catch {
    return null;
  }
}

/**
 * Google's page id for every slide, in order, read from the lightweight
 * "htmlpresent" view, which links one image per slide as
 * viewpage?pageid=<id>. Returns null if the page can't be read.
 */
export async function fetchSlidePageIds(presentationId: string): Promise<string[] | null> {
  try {
    const response = await fetch(
      `https://docs.google.com/presentation/d/${encodeURIComponent(presentationId)}/htmlpresent`,
      {
        cache: "no-store",
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(15_000),
      }
    );
    if (!response.ok) return null;
    const html = await response.text();
    const ids = [...html.matchAll(/viewpage\?pageid=([A-Za-z0-9_-]+)/g)].map(([, id]) => id);
    return ids.length ? [...new Set(ids)] : null;
  } catch {
    return null;
  }
}

export async function fetchGoogleSlides(presentationId: string) {
  // These run alongside the download and never reject.
  const publicEditAccess = checkPublicEditAccess(presentationId);
  const pageIds = fetchSlidePageIds(presentationId);

  let response: Response;
  try {
    response = await fetch(
      `https://docs.google.com/presentation/d/${encodeURIComponent(presentationId)}/export/pptx`,
      { cache: "no-store", redirect: "follow", signal: AbortSignal.timeout(30_000) }
    );
  } catch (error) {
    console.error("Google Slides export request did not complete", { presentationId, error });
    throw new GoogleSlidesError("failed");
  }

  if (response.status === 404) throw new GoogleSlidesError("not-found");
  if (response.status === 401 || response.status === 403) throw new GoogleSlidesError("not-public");
  if (!response.ok) {
    console.error("Google Slides export failed", { presentationId, status: response.status });
    throw new GoogleSlidesError("failed");
  }

  // A deck that isn't public redirects to Google's sign-in page instead of a file.
  if (!(response.headers.get("content-type") ?? "").startsWith(PPTX_CONTENT_TYPE)) {
    await response.body?.cancel();
    throw new GoogleSlidesError("not-public");
  }
  if (Number(response.headers.get("content-length") ?? 0) > MAX_DOWNLOAD_BYTES) {
    await response.body?.cancel();
    throw new GoogleSlidesError("too-large");
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > MAX_DOWNLOAD_BYTES) throw new GoogleSlidesError("too-large");

  let deck: ReturnType<typeof readPptxText>;
  try {
    deck = readPptxText(buffer, LIMITS.slides);
  } catch (error) {
    console.error("Could not read Google Slides export", { presentationId, error });
    throw new GoogleSlidesError("unreadable");
  }
  if (!deck.slides.length) throw new GoogleSlidesError("empty");

  // Page ids are only trusted when they line up one-to-one with the export.
  const ids = await pageIds;
  const idsMatch = ids !== null && ids.length === deck.slides.length;

  const slides: CourseSlide[] = deck.slides.map((slide, index) => ({
    title: clip(slide.title || `Slide ${index + 1}`, LIMITS.title),
    description: clip(slide.description, LIMITS.description),
    points: slide.points.slice(0, LIMITS.points).map((point) => clip(point, LIMITS.point)),
    ...(idsMatch ? { googleSlideId: ids[index] } : {}),
  }));

  // Google's export usually leaves the document title empty.
  return {
    title: deck.title ? clip(deck.title, 120) : "",
    slides,
    publicEditAccess: await publicEditAccess,
  };
}
