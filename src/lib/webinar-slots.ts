/**
 * Shared webinar free-slot vocabulary used by both the server routes and the
 * browser components. Every number here originates from the database; nothing
 * in this file computes or caches an authoritative slot count.
 */

export const REGISTRATION_STATUS = {
  freeConfirmed: "FREE_CONFIRMED",
  paymentPending: "PAYMENT_PENDING",
  paidConfirmed: "PAID_CONFIRMED",
  paymentFailed: "PAYMENT_FAILED",
  cancelled: "CANCELLED",
} as const;

export type RegistrationStatus =
  (typeof REGISTRATION_STATUS)[keyof typeof REGISTRATION_STATUS];

export const CONFIRMED_STATUSES: RegistrationStatus[] = [
  REGISTRATION_STATUS.freeConfirmed,
  REGISTRATION_STATUS.paidConfirmed,
];

export type RegistrationType = "FREE" | "PAID";

export interface WebinarAvailability {
  webinarId: string;
  freeRegistrationEnabled: boolean;
  freeSlotLimit: number;
  freeSlotsClaimed: number;
  freeSlotsRemaining: number;
  freeRegistrationAvailable: boolean;
  freeRegistrationStartsAt: string | null;
  freeRegistrationEndsAt: string | null;
  paymentRequired: boolean;
  price: number;
  pricePaise: number;
}

export type SlotTone = "open" | "limited" | "closed" | "paid-only";

/** Remaining slots at or below this count are shown as urgent. */
export const LOW_SLOT_THRESHOLD = 5;

export function formatRupees(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export function getSlotTone(availability: WebinarAvailability): SlotTone {
  if (!availability.freeRegistrationEnabled) return "paid-only";
  if (availability.freeSlotsRemaining <= 0) return "closed";
  if (!availability.freeRegistrationAvailable) return "closed";

  const isLow =
    availability.freeSlotsRemaining <= LOW_SLOT_THRESHOLD ||
    (availability.freeSlotLimit > 0 &&
      availability.freeSlotsRemaining / availability.freeSlotLimit <= 0.25);

  return isLow ? "limited" : "open";
}

/** Readable status text so meaning never depends on colour alone. */
export function getSlotStatusText(availability: WebinarAvailability) {
  switch (getSlotTone(availability)) {
    case "paid-only":
      return "Paid registration";
    case "closed":
      return "Free slots full · Paid registration open";
    case "limited":
      return `Only ${availability.freeSlotsRemaining} free ${
        availability.freeSlotsRemaining === 1 ? "registration" : "registrations"
      } remaining`;
    default:
      return `${availability.freeSlotsRemaining} of ${availability.freeSlotLimit} free slots available`;
  }
}

/** The short line shown directly under the registration button. */
export function getCtaHelperText(availability: WebinarAvailability) {
  if (!availability.freeRegistrationEnabled) {
    return `One-time payment of ${formatRupees(availability.pricePaise)}`;
  }
  if (!availability.freeRegistrationAvailable) {
    return "Free registration is now closed. Paid registration is still available.";
  }
  return getSlotTone(availability) === "limited"
    ? getSlotStatusText(availability)
    : `${availability.freeSlotsRemaining} of ${availability.freeSlotLimit} free slots available`;
}

/** Short badge for webinar cards and the hero. */
export function getSlotBadgeText(availability: WebinarAvailability) {
  switch (getSlotTone(availability)) {
    case "paid-only":
      return "PAID REGISTRATION";
    case "closed":
      return "FREE SLOTS FULL · PAID REGISTRATION OPEN";
    default:
      return `FREE — ${availability.freeSlotsRemaining} ${
        availability.freeSlotsRemaining === 1 ? "SLOT" : "SLOTS"
      } LEFT`;
  }
}

/** Main call-to-action label, always derived from the server response. */
export function getRegistrationCtaText(availability: WebinarAvailability) {
  return availability.freeRegistrationAvailable
    ? "Register Free"
    : `Register by Paying ${formatRupees(availability.pricePaise)}`;
}

export function getAnnouncementMessage(
  availability: WebinarAvailability | null,
  fallback: string
) {
  if (!availability || !availability.freeRegistrationEnabled) return fallback;

  const { freeSlotsRemaining, freeSlotLimit } = availability;
  if (!availability.freeRegistrationAvailable || freeSlotsRemaining <= 0) {
    return "Free registrations are now full — paid registration is still available.";
  }
  if (getSlotTone(availability) === "limited") {
    return `Hurry! Only ${freeSlotsRemaining} free webinar ${
      freeSlotsRemaining === 1 ? "registration is" : "registrations are"
    } left.`;
  }
  return `Free webinar registration is open — only ${freeSlotsRemaining} of ${freeSlotLimit} slots remaining. Register now!`;
}
