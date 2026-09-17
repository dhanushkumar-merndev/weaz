const EMBED_QUERY = "start=false&loop=false&delayms=3000";

type ParsedSlidesLink = { kind: "document" | "published"; id: string };

/**
 * Accepts the link an admin copies from Google Slides — the editor URL
 * (/presentation/d/<id>/edit) or a "Publish to web" URL
 * (/presentation/d/e/<id>/pub). Anything that is not a docs.google.com
 * presentation returns null.
 */
function parseSlidesLink(input: string): ParsedSlidesLink | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }

  if (url.protocol !== "https:" || url.hostname !== "docs.google.com") {
    return null;
  }

  const published = url.pathname.match(
    /^\/presentation\/d\/e\/([A-Za-z0-9_-]{20,})(?:\/|$)/
  );
  if (published) return { kind: "published", id: published[1] };

  const document = url.pathname.match(
    /^\/presentation\/d\/([A-Za-z0-9_-]{20,})(?:\/|$)/
  );
  if (document) return { kind: "document", id: document[1] };

  return null;
}

export function toGoogleSlidesEmbedUrl(input: string): string | null {
  const link = parseSlidesLink(input);
  if (!link) return null;
  return link.kind === "published"
    ? `https://docs.google.com/presentation/d/e/${link.id}/embed?${EMBED_QUERY}`
    : `https://docs.google.com/presentation/d/${link.id}/embed?${EMBED_QUERY}`;
}

/**
 * The deck id the Google Slides API needs. "Publish to web" links carry a
 * different id the API cannot read, so they return null.
 */
export function getGooglePresentationId(input: string): string | null {
  const link = parseSlidesLink(input);
  return link?.kind === "document" ? link.id : null;
}

/** A human-readable reason a pasted link can't become a module, or null. */
export function slidesLinkProblem(input: string): string | null {
  if (!input.trim()) return "Paste the Google Slides link.";
  if (!parseSlidesLink(input)) return "That isn't a Google Slides link.";
  if (!getGooglePresentationId(input)) {
    return "Use the Share link (…/presentation/d/…/edit), not a “Publish to web” link.";
  }
  return null;
}
