const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** True only when both browser-side Supabase values are actually present. */
export const isSupabaseConfigured = url.length > 0 && anonKey.length > 0;

/**
 * Missing keys during a local `next dev` run mean the developer just hasn't
 * filled in .env yet, so the app drops into "developer" mode and keeps
 * rendering. Anywhere else we assume production and let the failure surface.
 */
export const appMode: "developer" | "production" =
  !isSupabaseConfigured && process.env.NODE_ENV === "development"
    ? "developer"
    : "production";

/**
 * Structurally valid stand-ins. @supabase/ssr throws on construction if either
 * argument is empty, so developer mode needs something parseable to hand it.
 * Requests made with these fail at the network layer instead of at boot.
 */
const PLACEHOLDER_URL = "https://placeholder.supabase.co";
const PLACEHOLDER_ANON_KEY = "public-anon-key-not-configured";

let warned = false;

export function browserSupabaseCredentials(): [string, string] {
  if (isSupabaseConfigured) return [url, anonKey];

  if (!warned) {
    warned = true;
    console.warn(
      "[supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are missing. " +
        `Running in ${appMode} mode with placeholder credentials — sign-in and enrollment will not work. ` +
        "Copy .env.example to .env and fill in your project values."
    );
  }

  return [PLACEHOLDER_URL, PLACEHOLDER_ANON_KEY];
}
