import "server-only";

import type { CourseSlide } from "@/lib/course-types";

// Reads a Google Slides deck with an API key. An API key can only read decks
// shared as "Anyone with the link", so a successful read also proves students
// will be able to open the embedded deck.

export type GoogleSlidesErrorCode =
  | "missing-key"
  | "key-invalid"
  | "api-disabled"
  | "not-public"
  | "not-found"
  | "empty"
  | "failed";

const ERROR_MESSAGES: Record<GoogleSlidesErrorCode, string> = {
  "missing-key": "GOOGLE_API_KEY is not set on the server.",
  "key-invalid": "The Google API key is invalid or restricted.",
  "api-disabled": "Enable the Google Slides API for this API key in Google Cloud Console.",
  "not-public":
    "This deck isn't shared publicly. In Google Slides, set Share → General access → Anyone with the link · Viewer.",
  "not-found": "Google couldn't find this deck. Check the link.",
  empty: "This deck has no slides.",
  failed: "Couldn't read the deck from Google. Try again.",
};

export class GoogleSlidesError extends Error {
  readonly code: GoogleSlidesErrorCode;

  constructor(code: GoogleSlidesErrorCode) {
    super(ERROR_MESSAGES[code]);
    this.name = "GoogleSlidesError";
    this.code = code;
  }
}

export function isGoogleSlidesConfigured() {
  return Boolean(process.env.GOOGLE_API_KEY?.trim());
}

// The subset of the Slides API response this reader uses.
interface TextContent {
  textElements?: { textRun?: { content?: string } }[];
}

interface PageElement {
  objectId?: string;
  shape?: { placeholder?: { type?: string }; text?: TextContent };
  table?: { tableRows?: { tableCells?: { text?: TextContent }[] }[] };
  elementGroup?: { children?: PageElement[] };
}

interface Page {
  pageElements?: PageElement[];
  slideProperties?: {
    notesPage?: {
      pageElements?: PageElement[];
      notesProperties?: { speakerNotesObjectId?: string };
    };
  };
}

interface Presentation {
  title?: string;
  slides?: Page[];
}

const LIMITS = { slides: 150, title: 200, points: 20, point: 400, description: 3000 };
const TITLE_PLACEHOLDERS = new Set(["TITLE", "CENTERED_TITLE"]);

const clip = (value: string, max: number) =>
  value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;

/** Paragraphs of a text box. Soft line breaks () stay within a paragraph. */
function paragraphs(text: TextContent | undefined) {
  return (text?.textElements ?? [])
    .map((element) => element.textRun?.content ?? "")
    .join("")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function flatten(elements: PageElement[] = []): PageElement[] {
  return elements.flatMap((element) =>
    element.elementGroup ? flatten(element.elementGroup.children) : [element]
  );
}

/**
 * Slide title placeholder → heading, every other text box and table row →
 * points, speaker notes → description.
 */
export function slideFromPage(page: Page, index: number): CourseSlide {
  const elements = flatten(page.pageElements);
  const titleElement = elements.find(
    (element) =>
      TITLE_PLACEHOLDERS.has(element.shape?.placeholder?.type ?? "") &&
      paragraphs(element.shape?.text).length > 0
  );

  let title = titleElement ? paragraphs(titleElement.shape?.text).join(" ") : "";
  const points: string[] = [];

  for (const element of elements) {
    if (element === titleElement) continue;
    if (element.shape) points.push(...paragraphs(element.shape.text));
    for (const row of element.table?.tableRows ?? []) {
      const cells = (row.tableCells ?? [])
        .map((cell) => paragraphs(cell.text).join(" "))
        .filter(Boolean);
      if (cells.length) points.push(cells.join(" · "));
    }
  }

  if (!title && points.length) title = points.shift()!;

  const notesPage = page.slideProperties?.notesPage;
  const notesId = notesPage?.notesProperties?.speakerNotesObjectId;
  const notes = flatten(notesPage?.pageElements).find((element) => element.objectId === notesId);

  return {
    title: clip(title || `Slide ${index + 1}`, LIMITS.title),
    description: clip(paragraphs(notes?.shape?.text).join("\n"), LIMITS.description),
    points: points.slice(0, LIMITS.points).map((point) => clip(point, LIMITS.point)),
  };
}

export async function fetchGoogleSlides(presentationId: string) {
  const key = process.env.GOOGLE_API_KEY?.trim();
  if (!key) throw new GoogleSlidesError("missing-key");

  let response: Response;
  try {
    response = await fetch(
      `https://slides.googleapis.com/v1/presentations/${encodeURIComponent(presentationId)}?key=${encodeURIComponent(key)}`,
      { cache: "no-store", signal: AbortSignal.timeout(15_000) }
    );
  } catch (error) {
    console.error("Google Slides API request did not complete", { presentationId, error });
    throw new GoogleSlidesError("failed");
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: { status?: string; message?: string; details?: { reason?: string }[] };
    } | null;
    const message = body?.error?.message ?? "";
    const reasons = (body?.error?.details ?? []).map((detail) => detail.reason ?? "");

    if (reasons.some((reason) => reason.startsWith("API_KEY_")) || /API key not valid/i.test(message)) {
      throw new GoogleSlidesError("key-invalid");
    }
    if (reasons.includes("SERVICE_DISABLED") || /has not been used|is disabled/i.test(message)) {
      throw new GoogleSlidesError("api-disabled");
    }
    if (response.status === 404) throw new GoogleSlidesError("not-found");
    if (response.status === 403 || body?.error?.status === "PERMISSION_DENIED") {
      throw new GoogleSlidesError("not-public");
    }

    console.error("Google Slides API request failed", {
      presentationId,
      status: response.status,
      message,
    });
    throw new GoogleSlidesError("failed");
  }

  const presentation = (await response.json()) as Presentation;
  const pages = presentation.slides ?? [];
  if (!pages.length) throw new GoogleSlidesError("empty");

  return {
    title: clip(presentation.title?.trim() || "Untitled deck", 120),
    slides: pages.slice(0, LIMITS.slides).map(slideFromPage),
  };
}
