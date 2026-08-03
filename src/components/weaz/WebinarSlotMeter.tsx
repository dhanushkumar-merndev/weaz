"use client";

import { CheckCircle2, CreditCard, Users } from "lucide-react";
import {
  formatRupees,
  getSlotBadgeText,
  getSlotStatusText,
  getSlotTone,
  type SlotTone,
  type WebinarAvailability,
} from "@/lib/webinar-slots";

const TONE_STYLES: Record<
  SlotTone,
  { bar: string; dot: string; text: string; ring: string }
> = {
  open: {
    bar: "bg-emerald-400",
    dot: "bg-emerald-400",
    text: "text-emerald-300",
    ring: "border-emerald-400/25 bg-emerald-400/[0.07]",
  },
  limited: {
    bar: "bg-[#FB923C]",
    dot: "bg-[#FB923C]",
    text: "text-[#FDBA74]",
    ring: "border-[#FB923C]/30 bg-[#FB923C]/[0.08]",
  },
  closed: {
    bar: "bg-[#F87171]",
    dot: "bg-[#F87171]",
    text: "text-[#FCA5A5]",
    ring: "border-[#F87171]/25 bg-[#F87171]/[0.07]",
  },
  "paid-only": {
    bar: "bg-[#9B59D0]",
    dot: "bg-[#9B59D0]",
    text: "text-[#C99BEE]",
    ring: "border-[#9B59D0]/25 bg-[#9B59D0]/[0.08]",
  },
};

/**
 * Free-slot availability. Every value comes from the server; the colour is
 * always paired with readable status text so meaning never depends on it.
 */
export function WebinarSlotMeter({
  availability,
  className = "",
}: {
  availability: WebinarAvailability;
  className?: string;
}) {
  const tone = getSlotTone(availability);
  const styles = TONE_STYLES[tone];
  const { freeSlotLimit, freeSlotsClaimed, freeSlotsRemaining } = availability;
  const filledPercent =
    freeSlotLimit > 0
      ? Math.min(100, Math.round((freeSlotsClaimed / freeSlotLimit) * 100))
      : 100;

  if (!availability.freeRegistrationEnabled) {
    return (
      <div
        className={`rounded-2xl border ${styles.ring} p-4 ${className}`}
        data-testid="webinar-slot-meter"
        data-tone={tone}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2 text-sm font-bold text-white">
            <CreditCard size={15} className="text-[#C99BEE]" />
            Paid registration
          </span>
          <span className={`text-sm font-bold ${styles.text}`}>
            {formatRupees(availability.pricePaise)}
          </span>
        </div>
        <p className="mt-1.5 text-xs leading-5 text-white/50">
          Secure your seat with a one-time payment.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border ${styles.ring} p-4 ${className}`}
      data-testid="webinar-slot-meter"
      data-tone={tone}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-white/70">
          <Users size={14} className="shrink-0 text-white/45" />
          Free registration
        </span>
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-bold ${styles.text}`}
        >
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${styles.dot}`}
            aria-hidden="true"
          />
          {tone === "closed" ? "Closed" : tone === "limited" ? "Filling fast" : "Open"}
        </span>
      </div>

      <div className="mt-2 font-display text-lg font-black leading-tight text-white sm:text-xl">
        {freeSlotsRemaining > 0
          ? `${freeSlotsRemaining} ${freeSlotsRemaining === 1 ? "slot" : "slots"} available out of ${freeSlotLimit}`
          : `All ${freeSlotLimit} free slots claimed`}
      </div>

      <div
        className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={freeSlotLimit}
        aria-valuenow={freeSlotsClaimed}
        aria-label={`${freeSlotsClaimed} of ${freeSlotLimit} free slots claimed`}
      >
        <div
          className={`h-full rounded-full ${styles.bar} transition-[width] duration-500 ease-out`}
          style={{ width: `${filledPercent}%` }}
        />
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
        <span className={`font-semibold ${styles.text}`}>
          {getSlotStatusText(availability)}
        </span>
        <span className="text-white/40">
          {freeSlotsClaimed} of {freeSlotLimit} claimed
        </span>
      </div>

      {!availability.freeRegistrationAvailable && (
        <p className="mt-2.5 text-xs leading-5 text-white/55">
          Free registration is now closed. Paid registration is still available
          at {formatRupees(availability.pricePaise)}.
        </p>
      )}
    </div>
  );
}

/** Compact badge for hero sections and webinar listing cards. */
export function WebinarSlotBadge({
  availability,
  className = "",
}: {
  availability: WebinarAvailability;
  className?: string;
}) {
  const tone = getSlotTone(availability);
  const styles = TONE_STYLES[tone];

  return (
    <span
      data-testid="webinar-slot-badge"
      data-tone={tone}
      className={`inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] sm:text-[11px] ${styles.ring} ${styles.text} ${className}`}
    >
      {tone === "closed" ? (
        <CheckCircle2 size={13} className="shrink-0" aria-hidden="true" />
      ) : (
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${styles.dot}`}
          aria-hidden="true"
        />
      )}
      <span className="truncate">{getSlotBadgeText(availability)}</span>
    </span>
  );
}
