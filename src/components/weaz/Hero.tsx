"use client";
/* The hero image is a local static asset. */
/* eslint-disable @next/next/no-img-element */

import { ArrowRight, Sparkles } from "lucide-react";
import { motion, type Variants } from "framer-motion";
import { ShineButton } from "@/components/ui/ShineButton";
import { GsapCounter } from "@/components/ui/GsapCounter";

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
  hidden: { opacity: 0, y: 25 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

interface HeroProps {
  onEnroll: () => void;
}

const Hero = ({ onEnroll }: HeroProps) => {
  return (
    <section
      id="top"
      data-testid="hero-section"
      className="relative overflow-hidden pb-24 pt-32 md:pb-32 md:pt-40"
    >
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-12">
        <motion.div
          className="relative z-10 lg:col-span-7"
          variants={heroContainerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            data-testid="hero-eyebrow"
            variants={heroItemVariants}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70"
          >
            <Sparkles size={14} className="text-[#FBBF24]" />
            Digital Entrepreneurship &amp; AI
          </motion.div>

          <motion.h1
            data-testid="hero-headline"
            variants={heroItemVariants}
            className="font-display text-5xl font-black leading-[0.95] tracking-tighter text-white sm:text-6xl lg:text-7xl"
          >
            WEAZ TECH
            <span className="mt-4 block text-3xl font-semibold text-white/60 sm:text-4xl lg:text-5xl">
              Digital Entrepreneurship Program
            </span>
          </motion.h1>

          <motion.p
            data-testid="hero-subheadline"
            variants={heroItemVariants}
            className="mt-8 max-w-2xl text-xl text-white/70 md:text-2xl"
          >
            Learn. Build. Grow.{" "}
            <span className="font-bold text-[#FBBF24]">Lead with AI.</span>
          </motion.p>

          <motion.p
            variants={heroItemVariants}
            className="mt-6 max-w-xl text-sm leading-relaxed text-white/50 sm:text-base"
          >
            Real skills, real mentors, real outcomes. A community of tech-savvy
            founders and operators shaping India&apos;s AI-first economy.
          </motion.p>

          <motion.div
            variants={heroItemVariants}
            className="mt-10 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center"
          >
            <ShineButton
              data-testid="hero-enroll-btn"
              onClick={onEnroll}
              variant="gold"
              className="px-8 py-4 text-base"
            >
              Enroll Now <ArrowRight size={18} />
            </ShineButton>

            <motion.a
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              href="#programs"
              data-testid="hero-explore-btn"
              className="pill-ghost inline-flex items-center justify-center px-8 py-4 text-base font-medium"
            >
              Explore Programs
            </motion.a>
          </motion.div>

          <motion.div
            variants={heroItemVariants}
            className="mt-12 flex items-center gap-6 text-xs uppercase tracking-[0.2em] text-white/40 sm:gap-8"
          >
            <div>
              <div className="font-display text-2xl font-bold text-white">
                <GsapCounter end={90} suffix="%+" />
              </div>
              <div className="mt-1">Placement Rate</div>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div>
              <div className="font-display text-2xl font-bold text-white">
                <GsapCounter end={3} duration={1.2} />
              </div>
              <div className="mt-1">Signature Programs</div>
            </div>
            <div className="hidden h-8 w-px bg-white/10 sm:block" />
            <div className="hidden sm:block">
              <div className="font-display text-2xl font-bold text-white">1:1</div>
              <div className="mt-1">Mentorship</div>
            </div>
          </motion.div>
        </motion.div>

        <div className="relative lg:col-span-5">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="floaty gpu-accelerated relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-white/10"
          >
            <img
              src={HERO_IMG}
              alt="Confident entrepreneur speaking"
              className="h-full w-full object-cover"
              data-testid="hero-image"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F0B14] via-[#0F0B14]/20 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(155,89,208,0.35),transparent_60%)]" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
