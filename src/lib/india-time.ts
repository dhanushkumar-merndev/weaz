export const INDIA_TIME_ZONE = "Asia/Kolkata";

const INDIA_OFFSET = "+05:30";
const DATE_TIME_LOCAL_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export function formatIndiaDateTimeLocal(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: INDIA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

export function formatIndiaDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: INDIA_TIME_ZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  }).format(date);
}

export function parseIndiaDateTimeLocal(value: string) {
  const normalized = value.trim();
  if (!DATE_TIME_LOCAL_PATTERN.test(normalized)) return null;

  // datetime-local deliberately has no timezone. Webinar administration is
  // defined in IST, so attach India's fixed UTC offset before storing UTC.
  const date = new Date(`${normalized}:00.000${INDIA_OFFSET}`);
  if (
    Number.isNaN(date.getTime()) ||
    formatIndiaDateTimeLocal(date.toISOString()) !== normalized
  ) {
    return null;
  }

  return date.toISOString();
}
