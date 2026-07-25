"use client";

import React from "react";
import { ArrowRight, Sparkles } from "lucide-react";

const HERO_IMG = "/images/speaker-auditorium.jpg";

interface HeroProps {
  onEnroll: () => void;
}

const Hero = ({ onEnroll }: HeroProps) => {
  return (
    <section id="top" data-testid="hero-section" className="relative pt-32 pb-24 md:pt-40 md:pb-32">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-12 items-center relative">
        {/* Left */}
        <div className="lg:col-span-7 relative z-10">
          <div
            data-testid="hero-eyebrow"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.03] text-xs uppercase tracking-[0.2em] text-white/70 mb-8"
          >
            <Sparkles size={14} className="text-[#FBBF24]" />
            Digital Entrepreneurship &amp; AI
          </div>

          <h1
            data-testid="hero-headline"
            className="font-display text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter leading-[0.95] text-white"
          >
            WEAZ TECH
            <span className="block text-white/60 font-semibold text-3xl sm:text-4xl lg:text-5xl mt-4">
              Digital Entrepreneurship Program
            </span>
          </h1>

          <p data-testid="hero-subheadline" className="mt-8 text-xl md:text-2xl text-white/70 max-w-2xl">
            Learn. Build. Grow. <span className="text-[#FBBF24]">Lead with AI.</span>
          </p>

          <p className="mt-6 text-white/50 max-w-xl leading-relaxed">
            Real skills, real mentors, real outcomes. A community of tech-savvy founders and
            operators shaping India&apos;s AI-first economy.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <button
              data-testid="hero-enroll-btn"
              onClick={onEnroll}
              className="pill-gold px-8 py-4 text-base inline-flex items-center gap-2 cursor-pointer"
            >
              Enroll Now <ArrowRight size={18} />
            </button>
            <a
              href="#programs"
              data-testid="hero-explore-btn"
              className="pill-ghost px-8 py-4 text-base inline-flex items-center justify-center"
            >
              Explore Programs
            </a>
          </div>

          <div className="mt-12 flex items-center gap-8 text-xs uppercase tracking-[0.2em] text-white/40">
            <div>
              <div className="text-2xl font-display text-white font-bold">90%+</div>
              <div className="mt-1">Placement Rate</div>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div>
              <div className="text-2xl font-display text-white font-bold">3</div>
              <div className="mt-1">Signature Programs</div>
            </div>
            <div className="h-8 w-px bg-white/10 hidden sm:block" />
            <div className="hidden sm:block">
              <div className="text-2xl font-display text-white font-bold">1:1</div>
              <div className="mt-1">Mentorship</div>
            </div>
          </div>
        </div>

        {/* Right: Image */}
        <div className="lg:col-span-5 relative">
          <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden border border-white/10 floaty">
            <img
              src={HERO_IMG}
              alt="Confident entrepreneur speaking"
              className="w-full h-full object-cover"
              data-testid="hero-image"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F0B14] via-[#0F0B14]/20 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(155,89,208,0.35),transparent_60%)]" />

            <div className="absolute bottom-6 left-6 right-6 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#FBBF24] animate-pulse" />
              <span className="text-xs uppercase tracking-[0.25em] text-white/80">
                Cohort Now Enrolling
              </span>
            </div>
          </div>

          {/* Decorative small card */}
          <div className="absolute -bottom-8 -left-6 hidden md:block surface-card p-4 pr-6 w-64">
            <div className="text-[10px] uppercase tracking-[0.25em] text-white/50 mb-1">
              Next Cohort
            </div>
            <div className="font-display text-lg font-bold text-white">Limited Seats</div>
            <div className="text-xs text-white/60 mt-1">Priority interviews open now.</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
