"use client";
/* The hero image is a local static asset. */
/* eslint-disable @next/next/no-img-element */

import { ArrowRight, Sparkles, Star } from "lucide-react";
import { motion, type Variants } from "framer-motion";
import { ShineButton } from "@/components/ui/ShineButton";
import { GsapCounter } from "@/components/ui/GsapCounter";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

const HERO_IMG = "/images/speaker-auditorium.jpg";

const learnerAvatars = [
  {
    src: "/images/avatar-christina.webp",
    alt: "WEAZ TECH learner",
    fallback: "C",
  },
  {
    src: "/images/avatar-matthew.webp",
    alt: "WEAZ TECH learner",
    fallback: "M",
  },
  {
    src: "/images/avatar-yogendra.webp",
    alt: "WEAZ TECH learner",
    fallback: "Y",
  },
];

function LearnerRating() {
  return (
    <div className="flex items-center gap-4">
      <div className="flex -space-x-3" aria-label="Learner avatars">
        {learnerAvatars.map((avatar) => (
          <Avatar
            key={avatar.src}
            className="h-11 w-11 border-[3px] border-[#0F0B14] bg-[#1A1525] shadow-lg shadow-black/25"
          >
            <AvatarImage src={avatar.src} alt={avatar.alt} />
            <AvatarFallback>{avatar.fallback}</AvatarFallback>
          </Avatar>
        ))}
      </div>
      <div>
        <div className="flex items-center gap-2">
          <div className="flex items-center" aria-label="4.5 out of 5 stars">
            {[0, 1, 2, 3, 4].map((star) => (
              <span key={star} className="relative h-[18px] w-[18px]">
                <Star
                  size={18}
                  className="absolute inset-0 fill-white/10 text-white/15"
                />
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: star === 4 ? "50%" : "100%" }}
                >
                  <Star
                    size={18}
                    className="fill-[#FBBF24] text-[#FBBF24]"
                  />
                </span>
              </span>
            ))}
          </div>
          <span className="font-display text-lg font-black text-white">4.5</span>
        </div>
        <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
          Learner rating
        </div>
      </div>
    </div>
  );
}

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
      className="relative overflow-hidden pb-12 pt-20 sm:pb-20 sm:pt-28 md:pb-32 md:pt-40"
    >
      <div className="absolute inset-0 lg:hidden">
        <img
          src={HERO_IMG}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover object-[62%_center]"
        />
        <div className="absolute inset-0 bg-[#0F0B14]/72" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F0B14] via-[#0F0B14]/85 to-[#0F0B14]/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0F0B14]/75 via-transparent to-[#0F0B14]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_38%,rgba(155,89,208,0.18),transparent_45%)]" />
      </div>

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

          <motion.div variants={heroItemVariants} className="mt-8">
            <LearnerRating />
          </motion.div>

          <motion.div
            variants={heroItemVariants}
            className="mt-7 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center"
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
            className="mt-12 grid w-full max-w-xl grid-cols-3 text-[8px] uppercase tracking-[0.12em] text-white/40 sm:text-xs sm:tracking-[0.2em]"
          >
            <div className="border-r border-white/10 pr-2">
              <div className="font-display text-xl font-bold text-white sm:text-2xl">
                <GsapCounter end={90} suffix="%+" />
              </div>
              <div className="mt-1 leading-tight">Placement Rate</div>
            </div>
            <div className="border-r border-white/10 px-3 sm:px-6">
              <div className="font-display text-xl font-bold text-white sm:text-2xl">
                <GsapCounter end={3} duration={1.2} />
              </div>
              <div className="mt-1 leading-tight">Signature Programs</div>
            </div>
            <div className="pl-3 sm:pl-6">
              <div className="font-display text-xl font-bold text-white sm:text-2xl">
                1:1
              </div>
              <div className="mt-1 leading-tight">Mentorship</div>
            </div>
          </motion.div>
        </motion.div>

        <div className="relative hidden lg:col-span-5 lg:block">
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
