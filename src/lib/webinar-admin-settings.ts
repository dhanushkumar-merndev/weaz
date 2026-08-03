import { parseIndiaDateTimeLocal } from "@/lib/india-time";

export interface FreeRegistrationSettings {
  free_registration_enabled: boolean;
  free_slot_limit: number;
  free_registration_starts_at: string | null;
  free_registration_ends_at: string | null;
}

export const MAX_FREE_SLOT_LIMIT = 1_000_000;

type RawValue = FormDataEntryValue | string | number | boolean | null | undefined;

function readBoolean(value: RawValue) {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "on" || normalized === "1";
}

function readOptionalIstDateTime(value: RawValue) {
  if (typeof value !== "string" || !value.trim()) {
    return { ok: true as const, value: null };
  }
  // A stored ISO timestamp round-trips through the admin form unchanged.
  if (value.includes("Z") || /[+-]\d{2}:\d{2}$/.test(value)) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime())
      ? { ok: false as const, value: null }
      : { ok: true as const, value: parsed.toISOString() };
  }
  const parsed = parseIndiaDateTimeLocal(value);
  return parsed
    ? { ok: true as const, value: parsed }
    : { ok: false as const, value: null };
}

/**
 * Validates the admin free-registration inputs. The slot limit may be raised or
 * lowered later; the database refuses any value below the number of free slots
 * already handed out.
 */
export function parseFreeRegistrationSettings(read: (key: string) => RawValue):
  | { ok: true; settings: FreeRegistrationSettings }
  | { ok: false; error: string } {
  const enabled = readBoolean(read("free_registration_enabled"));

  const rawLimit = read("free_slot_limit");
  const limit =
    rawLimit === null || rawLimit === undefined || rawLimit === ""
      ? 0
      : Number(rawLimit);
  if (
    !Number.isInteger(limit) ||
    limit < 0 ||
    limit > MAX_FREE_SLOT_LIMIT
  ) {
    return {
      ok: false,
      error: `Enter a whole number of free slots between 0 and ${MAX_FREE_SLOT_LIMIT.toLocaleString("en-IN")}`,
    };
  }
  if (enabled && limit < 1) {
    return {
      ok: false,
      error: "Enter at least one free slot to enable free registration",
    };
  }

  const startsAt = readOptionalIstDateTime(read("free_registration_starts_at"));
  if (!startsAt.ok) {
    return { ok: false, error: "Enter a valid free registration start time" };
  }
  const endsAt = readOptionalIstDateTime(read("free_registration_ends_at"));
  if (!endsAt.ok) {
    return { ok: false, error: "Enter a valid free registration end time" };
  }
  if (
    startsAt.value &&
    endsAt.value &&
    new Date(endsAt.value) <= new Date(startsAt.value)
  ) {
    return {
      ok: false,
      error: "Free registration must end after it starts",
    };
  }

  return {
    ok: true,
    settings: {
      free_registration_enabled: enabled,
      free_slot_limit: limit,
      free_registration_starts_at: startsAt.value,
      free_registration_ends_at: endsAt.value,
    },
  };
}
