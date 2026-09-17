import { getGooglePresentationId, slidesLinkProblem } from "@/lib/google-slides";

export const MODULE_TITLE_MAX = 120;
export const MODULE_SUMMARY_MAX = 500;
const URL_MAX = 2000;

export interface ModuleFields {
  title?: string;
  summary?: string;
  slidesUrl?: string;
  presentationId?: string;
}

/**
 * Validates the module fields present in a request body. Absent fields stay
 * undefined; an empty title is allowed here and handled by each route.
 */
export function readModuleFields(
  body: Record<string, unknown>
): { fields: ModuleFields } | { error: string } {
  const fields: ModuleFields = {};

  if (body.title !== undefined) {
    if (typeof body.title !== "string") return { error: "Invalid title" };
    const title = body.title.trim();
    if (title && (title.length < 2 || title.length > MODULE_TITLE_MAX)) {
      return { error: `Title must be 2–${MODULE_TITLE_MAX} characters.` };
    }
    fields.title = title;
  }

  if (body.summary !== undefined) {
    if (typeof body.summary !== "string") return { error: "Invalid description" };
    const summary = body.summary.trim();
    if (summary.length > MODULE_SUMMARY_MAX) {
      return { error: `Description must be at most ${MODULE_SUMMARY_MAX} characters.` };
    }
    fields.summary = summary;
  }

  if (body.slidesUrl !== undefined) {
    if (typeof body.slidesUrl !== "string") return { error: "Invalid Google Slides link" };
    const url = body.slidesUrl.trim();
    const problem = url.length > URL_MAX ? "That link is too long." : slidesLinkProblem(url);
    if (problem) return { error: problem };
    fields.slidesUrl = new URL(url).href;
    fields.presentationId = getGooglePresentationId(url)!;
  }

  return { fields };
}
