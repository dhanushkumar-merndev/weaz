"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";

/** Comfortable reading pace, in pixels per second. */
const SCROLL_SPEED = 55;

/**
 * Single-line announcement.
 *
 * A message that fits the bar is simply centred and still — there is nothing
 * to scroll. Only a message wider than the bar glides from right to left,
 * fading out at the end and back in on restart, at a constant reading pace
 * regardless of screen width. Hovering or focusing pauses it, and
 * `prefers-reduced-motion` keeps it static (see globals.css).
 */
export function WebinarAnnouncementMarquee({
  message,
  actionLabel,
}: {
  message: string;
  actionLabel?: string;
}) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const trackRef = useRef<HTMLSpanElement>(null);
  const [scrolling, setScrolling] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(22);

  useEffect(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

    const measure = () => {
      const available = container.clientWidth;
      // The track is inline-block, so its scroll width is the natural text
      // width even while it is translated off-screen.
      const needed = track.scrollWidth;
      const overflows = needed > available + 1;
      setScrolling(overflows);
      if (overflows) {
        // The track travels twice its own width: in from the right, out past
        // the left. Pacing by distance keeps the speed identical on a phone
        // and on a wide desktop bar.
        setDurationSeconds(
          Math.min(45, Math.max(12, (needed * 2) / SCROLL_SPEED))
        );
      }
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    observer.observe(track);
    return () => observer.disconnect();
  }, [message, actionLabel]);

  return (
    <span ref={containerRef} className="webinar-marquee block w-full">
      <span
        ref={trackRef}
        className={`webinar-marquee-track ${
          scrolling ? "webinar-marquee-moving" : "webinar-marquee-static"
        }`}
        style={
          scrolling
            ? ({
                "--webinar-marquee-duration": `${durationSeconds}s`,
              } as React.CSSProperties)
            : undefined
        }
      >
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
