"use client";
/* The hero background is a local, already optimized static asset. */
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion, type Variants } from "framer-motion";
import { ShineButton } from "@/components/ui/ShineButton";

const HERO_IMG = "/images/speaker-auditorium.jpg";

const heroContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const heroItemVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

interface ActiveWebinar {
  id: string;
  title: string;
}

const Hero = () => {
  const [activeWebinar, setActiveWebinar] = useState<ActiveWebinar | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/webinars/active", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : { webinar: null }))
      .then((result) => {
        if (!cancelled) {
          setActiveWebinar(
            result.webinar
              ? { id: result.webinar.id, title: result.webinar.title }
              : null
          );
        }
      })
      .catch(() => {
        if (!cancelled) setActiveWebinar(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      id="top"
      data-testid="hero-section"
      className="relative flex min-h-[760px] items-center overflow-hidden pb-20 pt-32 md:min-h-[860px] md:pb-24 md:pt-40"
    >
      <div className="absolute inset-0">
        <img
          src={HERO_IMG}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover object-center opacity-30"
        />
        <div className="absolute inset-0 bg-[#0F0B14]/70" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_34%,rgba(155,89,208,0.18),transparent_45%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0F0B14]/75 via-transparent to-[#0F0B14]" />
      </div>

      <motion.div
        className="relative z-10 mx-auto w-full max-w-7xl px-5 text-center sm:px-6"
        variants={heroContainerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          data-testid="hero-eyebrow"
          variants={heroItemVariants}
          className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70 backdrop-blur-md"
        >
          <Sparkles size={14} className="text-[#FBBF24]" />
          Digital Entrepreneurship &amp; AI
        </motion.div>

        <motion.h1
          data-testid="hero-headline"
          variants={heroItemVariants}
          className="font-display mx-auto max-w-6xl text-[clamp(3rem,7.3vw,6.8rem)] font-black leading-[0.96] tracking-[-0.055em]"
        >
          <span className="block text-white">AI Is Replacing Jobs.</span>
          <span className="mt-3 block text-white/55">
            It&apos;s Also Creating
          </span>
          <span className="block text-white/55">Millionaires.</span>
          <span className="mt-5 block text-[#FBBF24]">
            Which One Are You Becoming?
          </span>
        </motion.h1>

        <motion.p
          data-testid="hero-subheadline"
          variants={heroItemVariants}
          className="mx-auto mt-8 max-w-3xl text-base leading-relaxed text-white/65 sm:text-xl md:text-2xl"
        >
          Learn. Build. Grow. Lead with AI — real skills, real mentors, real
          outcomes, in 3–6 months.
        </motion.p>

        {activeWebinar && (
          <motion.div variants={heroItemVariants} className="mt-9">
            <ShineButton
              data-testid="hero-webinar-btn"
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
};

export default Hero;
