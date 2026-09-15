const EMBED_QUERY = "start=false&loop=false&delayms=3000";

/**
 * Accepts the link an admin copies from Google Slides — the editor URL
 * (/presentation/d/<id>/edit) or a "Publish to web" URL
 * (/presentation/d/e/<id>/pub) — and returns its embeddable form.
 * Anything that is not a docs.google.com presentation returns null.
 */
export function toGoogleSlidesEmbedUrl(input: string): string | null {
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
  if (published) {
    return `https://docs.google.com/presentation/d/e/${published[1]}/embed?${EMBED_QUERY}`;
  }

  const document = url.pathname.match(
    /^\/presentation\/d\/([A-Za-z0-9_-]{20,})(?:\/|$)/
  );
  if (document) {
    return `https://docs.google.com/presentation/d/${document[1]}/embed?${EMBED_QUERY}`;
  }

  return null;
}
