/**
 * What the visitor was in the middle of doing when they were sent to Google
 * to sign in.
 *
 * The OAuth round trip replaces the page, so React state is gone by the time
 * the visitor comes back. This keeps the intent — and anything they had
 * already typed — in sessionStorage, which survives the redirect within the
 * same tab, so the right form reopens already filled in.
 */

export type AuthIntent =
  | {
      type: "webinar";
      webinarId: string;
      form: { name: string; phone: string };
    }
  | {
      type: "enrollment";
      programId: string;
      form: { name: string; phone: string; message: string };
    };

const STORAGE_KEY = "weaz-auth-intent";

/** A stale intent must never reopen a form days later. */
const MAX_AGE_MS = 15 * 60 * 1000;

type StoredIntent = AuthIntent & { at: number };

export function saveAuthIntent(intent: AuthIntent) {
  try {
    const stored: StoredIntent = { ...intent, at: Date.now() };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // A blocked sessionStorage only costs the visitor a retyped form.
  }
}

function read(): StoredIntent | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as StoredIntent | null;
    if (
      !parsed ||
      typeof parsed.at !== "number" ||
      Date.now() - parsed.at > MAX_AGE_MS
    ) {
      clearAuthIntent();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/** Reads the intent without consuming it. */
export function peekAuthIntent(): AuthIntent | null {
  return read();
}

/** Reads the intent and removes it, so a reopen only ever happens once. */
export function takeAuthIntent(): AuthIntent | null {
  const intent = read();
  if (intent) clearAuthIntent();
  return intent;
}

export function clearAuthIntent() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clean up if storage is unavailable.
  }
}

/** Keeps a value the visitor already typed instead of a blank replacement. */
export function mergeEntered<T extends Record<string, string>>(
  current: T,
  restored: Partial<T>
): T {
  const merged = { ...current };
  for (const [key, value] of Object.entries(restored)) {
    if (typeof value === "string" && value.trim()) {
      merged[key as keyof T] = value as T[keyof T];
    }
  }
  return merged;
}
