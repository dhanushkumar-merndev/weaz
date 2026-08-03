"use client";

import { Sparkles } from "lucide-react";

/**
 * Single-line announcement that glides from right to left, fades out at the
 * end and fades back in on restart. Hovering or focusing pauses it, and
 * `prefers-reduced-motion` turns it into static text (see globals.css).
 */
export function WebinarAnnouncementMarquee({
  message,
  actionLabel,
}: {
  message: string;
  actionLabel?: string;
}) {
  // Longer copy scrolls for longer so the reading speed stays constant.
  const durationSeconds = Math.min(
    36,
    Math.max(16, Math.round(message.length * 0.28))
  );

  return (
    <span
      className="webinar-marquee block w-full"
      style={
        { "--webinar-marquee-duration": `${durationSeconds}s` } as React.CSSProperties
      }
    >
      <span className="webinar-marquee-track text-center">
        <span className="inline-flex items-center gap-2 align-middle">
          <Sparkles size={14} className="shrink-0 text-[#FBBF24]" />
          <span>{message}</span>
          {actionLabel && (
            <span className="font-bold text-[#FBBF24] underline underline-offset-4">
              {actionLabel}
            </span>
          )}
        </span>
      </span>
    </span>
  );
}
