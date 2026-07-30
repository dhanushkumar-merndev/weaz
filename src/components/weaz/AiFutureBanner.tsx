"use client";
/* The background is a local static texture. */
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, Sparkles } from "lucide-react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { ShineButton } from "@/components/ui/ShineButton";
import { useActiveWebinar } from "@/hooks/useActiveWebinar";

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 25 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] },
  },
};

interface CountdownValue {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  complete: boolean;
}

function getCountdown(target: string): CountdownValue {
  const remaining = Math.max(0, new Date(target).getTime() - Date.now());
  return {
    days: Math.floor(remaining / 86_400_000),
    hours: Math.floor((remaining / 3_600_000) % 24),
    minutes: Math.floor((remaining / 60_000) % 60),
    seconds: Math.floor((remaining / 1_000) % 60),
    complete: remaining <= 0,
  };
}

function CountdownUnit({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  const display = String(value).padStart(2, "0");
  return (
    <div className="min-w-[66px] rounded-2xl border border-white/10 bg-black/30 px-3 py-3 text-center shadow-lg shadow-black/20 backdrop-blur-md sm:min-w-[82px] sm:px-4 sm:py-4">
      <div className="relative h-8 overflow-hidden sm:h-10">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={display}
            initial={{ y: 20, opacity: 0, filter: "blur(4px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            exit={{ y: -20, opacity: 0, filter: "blur(4px)" }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="font-display absolute inset-0 text-2xl font-black tabular-nums text-white sm:text-3xl"
          >
            {display}
          </motion.span>
        </AnimatePresence>
      </div>
      <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white/35 sm:text-[10px]">
        {label}
      </div>
    </div>
  );
}

function WebinarCountdown({ startsAt }: { startsAt: string }) {
  const [countdown, setCountdown] = useState<CountdownValue | null>(null);

  useEffect(() => {
    const update = () => setCountdown(getCountdown(startsAt));
    const initialTimer = window.setTimeout(update, 0);
    const timer = window.setInterval(update, 1_000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, [startsAt]);

  if (!countdown) return <div className="h-[90px] sm:h-[106px]" />;

  if (countdown.complete) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-[#FBBF24]/20 bg-[#FBBF24]/10 px-5 py-2.5 text-sm font-bold text-[#FBBF24]">
        <span className="h-2 w-2 animate-pulse rounded-full bg-[#FBBF24]" />
        Webinar starting soon
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
        <CalendarDays size={14} className="text-[#9B59D0]" />
        Live webinar begins in
      </div>
      <div className="flex justify-center gap-2 sm:gap-3">
        <CountdownUnit value={countdown.days} label="Days" />
        <CountdownUnit value={countdown.hours} label="Hours" />
        <CountdownUnit value={countdown.minutes} label="Minutes" />
        <CountdownUnit value={countdown.seconds} label="Seconds" />
      </div>
    </div>
  );
}

export function AiFutureBanner() {
  const { data: activeWebinar = null } = useActiveWebinar();

  return (
    <section
      id="ai-future"
      data-testid="ai-future-section"
      className="relative isolate overflow-hidden border-y border-white/[0.06] py-24 sm:py-28 md:py-36"
    >
      <div className="absolute inset-0 -z-20">
        <img
          src="/images/purple-texture.jpg"
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover opacity-25"
        />
      </div>
      <div className="absolute inset-0 -z-10 bg-[#0F0B14]/75" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(circle_at_center,black,transparent_78%)]" />
      <div className="absolute left-1/2 top-1/2 -z-10 h-[520px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#9B59D0]/10 blur-[110px]" />

      <motion.div
        className="mx-auto max-w-7xl px-5 text-center sm:px-6"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        transition={{ staggerChildren: 0.12 }}
      >
        <motion.div
          variants={itemVariants}
          className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70 backdrop-blur-md"
        >
          <Sparkles size={14} className="text-[#FBBF24]" />
          Your AI future starts now
        </motion.div>

        <motion.h2
          variants={itemVariants}
          className="font-display mx-auto max-w-6xl text-[clamp(2.8rem,7vw,6.7rem)] font-black leading-[0.96] tracking-[-0.055em]"
        >
          <span className="block text-white">AI Is Replacing Jobs.</span>
          <span className="mt-3 block text-white/55">
            It&apos;s Also Creating
          </span>
          <span className="block text-white/55">Millionaires.</span>
          <span className="mt-5 block text-[#FBBF24]">
            Which One Are You Becoming?
          </span>
        </motion.h2>

        <motion.p
          variants={itemVariants}
          className="mx-auto mt-8 max-w-3xl text-base leading-relaxed text-white/65 sm:text-xl md:text-2xl"
        >
          Learn. Build. Grow. Lead with AI — real skills, real mentors, real
          outcomes, in 3–6 months.
        </motion.p>

        {activeWebinar?.starts_at && (
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="mt-9"
          >
            <WebinarCountdown startsAt={activeWebinar.starts_at} />
          </motion.div>
        )}

        {activeWebinar && (
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className={activeWebinar.starts_at ? "mt-7" : "mt-9"}
          >
            <ShineButton
              data-testid="ai-future-webinar-btn"
              onClick={() =>
                window.dispatchEvent(new CustomEvent("weaz-open-webinar"))
              }
              variant="gold"
              className="px-8 py-4 text-base sm:px-10"
            >
              Register for {activeWebinar.title}
              <ArrowRight size={18} />
            </ShineButton>
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}
