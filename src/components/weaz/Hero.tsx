"use client";

import React from "react";
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
    <section id="top" data-testid="hero-section" className="relative pt-32 pb-24 md:pt-40 md:pb-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-12 items-start relative">
        {/* Left */}
        <motion.div
          className="lg:col-span-7 relative z-10"
          variants={heroContainerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            data-testid="hero-eyebrow"
            variants={heroItemVariants}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.03] text-xs uppercase tracking-[0.2em] text-white/70 mb-8"
          >
            <Sparkles size={14} className="text-[#FBBF24]" />
            Digital Entrepreneurship &amp; AI
          </motion.div>

          <motion.h1
            data-testid="hero-headline"
            variants={heroItemVariants}
            className="font-display text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter leading-[0.95] text-white"
          >
            WEAZ TECH
            <span className="block text-white/60 font-semibold text-3xl sm:text-4xl lg:text-5xl mt-4">
              Digital Entrepreneurship Program
            </span>
          </motion.h1>

          <motion.p
            data-testid="hero-subheadline"
            variants={heroItemVariants}
            className="mt-8 text-xl md:text-2xl text-white/70 max-w-2xl"
          >
            Learn. Build. Grow. <span className="text-[#FBBF24] font-bold">Lead with AI.</span>
          </motion.p>

          <motion.p
            variants={heroItemVariants}
            className="mt-6 text-white/50 max-w-xl leading-relaxed text-sm sm:text-base"
          >
            Real skills, real mentors, real outcomes. A community of tech-savvy founders and
            operators shaping India&apos;s AI-first economy.
          </motion.p>

          <motion.div
            variants={heroItemVariants}
            className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-4"
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
              className="pill-ghost px-8 py-4 text-base inline-flex items-center justify-center font-medium"
            >
              Explore Programs
            </motion.a>
          </motion.div>

          <motion.div
            variants={heroItemVariants}
            className="mt-12 flex items-center gap-6 sm:gap-8 text-xs uppercase tracking-[0.2em] text-white/40"
          >
            <div>
              <div className="text-2xl font-display text-white font-bold">
                <GsapCounter end={90} suffix="%+" />
              </div>
              <div className="mt-1">Placement Rate</div>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div>
              <div className="text-2xl font-display text-white font-bold">
                <GsapCounter end={3} duration={1.2} />
              </div>
              <div className="mt-1">Signature Programs</div>
            </div>
            <div className="h-8 w-px bg-white/10 hidden sm:block" />
            <div className="hidden sm:block">
              <div className="text-2xl font-display text-white font-bold">1:1</div>
              <div className="mt-1">Mentorship</div>
            </div>
          </motion.div>
        </motion.div>

        {/* Right: Image */}
        <div className="lg:col-span-5 relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative aspect-[4/5] rounded-[2rem] overflow-hidden border border-white/10 floaty gpu-accelerated"
          >
            <img
              src={HERO_IMG}
              alt="Confident entrepreneur speaking"
              className="w-full h-full object-cover"
              data-testid="hero-image"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F0B14] via-[#0F0B14]/20 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(155,89,208,0.35),transparent_60%)]" />

            <div className="absolute bottom-6 left-6 right-6 flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FBBF24] animate-pulse" />
              <span className="text-xs uppercase tracking-[0.25em] text-white/90 font-semibold">
                Cohort Now Enrolling
              </span>
            </div>
          </motion.div>

          {/* Decorative small card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="absolute -bottom-8 -left-6 hidden md:block surface-card p-4 pr-6 w-64 shadow-2xl border-white/15"
          >
            <div className="text-[10px] uppercase tracking-[0.25em] text-[#FBBF24] font-bold mb-1">
              Next Cohort
            </div>
            <div className="font-display text-lg font-bold text-white">Limited Seats</div>
            <div className="text-xs text-white/60 mt-1">Priority interviews open now.</div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
