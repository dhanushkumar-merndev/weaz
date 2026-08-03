"use client";

import { Users } from "lucide-react";
import {
  formatRupees,
  getSlotTone,
  type SlotTone,
  type WebinarAvailability,
} from "@/lib/webinar-slots";

const TONE_STYLES: Record<
  SlotTone,
  { bar: string; dot: string; text: string; ring: string }
> = {
  open: {
    bar: "bg-[#FBBF24]",
    dot: "bg-[#FBBF24]",
    text: "text-[#FBBF24]",
    ring: "border-[#FBBF24]/30 bg-[#FBBF24]/[0.07]",
  },
  // A deeper orange so "filling fast" stays distinct from the gold open state.
  limited: {
    bar: "bg-[#F97316]",
    dot: "bg-[#F97316]",
    text: "text-[#FB923C]",
    ring: "border-[#F97316]/35 bg-[#F97316]/[0.09]",
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

  // Nothing to meter when the webinar is paid-only. The price and the secure
  // payment note already carry that, and repeating it just crowds the CTA.
  if (!availability.freeRegistrationEnabled) return null;

  // The bar shows seats still open, so a fresh webinar reads as full rather
  // than as an empty, unfinished-looking track.
  const remainingPercent =
    freeSlotLimit > 0
      ? Math.max(0, Math.min(100, (freeSlotsRemaining / freeSlotLimit) * 100))
      : 0;

  return (
    <div
      className={`card-shine rounded-2xl border ${styles.ring} px-4 py-3.5 ${className}`}
      data-testid="webinar-slot-meter"
      data-tone={tone}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#FBBF24]">
          <Users size={13} className="shrink-0" />
          Free registration
        </span>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 text-[11px] font-bold ${styles.text}`}
        >
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${styles.dot}`}
            aria-hidden="true"
          />
          {tone === "closed"
            ? "Closed"
            : tone === "limited"
              ? "Filling fast"
              : "Open"}
        </span>
      </div>

      <div className="mt-2.5 flex items-baseline gap-2">
        <span className="font-display text-2xl font-black leading-none text-[#FBBF24]">
          {freeSlotsRemaining > 0 ? freeSlotsRemaining : "0"}
        </span>
        <span className="text-sm font-medium text-white/50">
          {freeSlotsRemaining > 0
            ? `of ${freeSlotLimit} free seats left`
            : `of ${freeSlotLimit} free seats left`}
        </span>
      </div>

      <div
        className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={freeSlotLimit}
        aria-valuenow={freeSlotsRemaining}
        aria-label={`${freeSlotsRemaining} of ${freeSlotLimit} free seats left`}
      >
        <div
          className={`h-full rounded-full ${styles.bar} transition-[width] duration-500 ease-out`}
          style={{ width: `${remainingPercent}%` }}
        />
      </div>

      {/* Only shown when it adds something the numbers above do not. */}
      {(tone !== "open" || freeSlotsClaimed > 0) && (
        <p className="mt-2.5 text-[11px] leading-4 text-white/45">
          {availability.freeRegistrationAvailable
            ? `${freeSlotsClaimed} already claimed`
            : `Free registration closed · Paid entry ${formatRupees(availability.pricePaise)}`}
        </p>
      )}
    </div>
  );
}

