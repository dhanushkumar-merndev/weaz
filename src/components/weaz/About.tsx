"use client";

import React from "react";
import { Target, Eye } from "lucide-react";

const About = () => {
  return (
    <section id="about" data-testid="about-section" className="relative py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-3xl">
          <div className="text-xs uppercase tracking-[0.25em] text-[#9B59D0] font-bold mb-4">
            About WEAZ Tech
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-white">
            The Technology &amp;<br />
            <span className="text-white/60">The Mission</span>
          </h2>
        </div>

        <div className="mt-14 grid md:grid-cols-2 gap-6">
          <div data-testid="mission-card" className="surface-card p-8 md:p-10">
            <div className="w-12 h-12 rounded-2xl bg-[#9B59D0]/15 border border-[#9B59D0]/30 grid place-items-center mb-6">
              <Target size={22} className="text-[#9B59D0]" />
            </div>
            <div className="text-xs uppercase tracking-[0.25em] text-white/50 font-bold">
              Mission
            </div>
            <h3 className="mt-3 font-display text-2xl md:text-3xl font-bold leading-tight text-white">
              Empower aspiring entrepreneurs with cutting-edge digital &amp; AI skills.
            </h3>
            <p className="mt-4 text-white/60 leading-relaxed">
              We build the operator&apos;s edge — practical AI literacy, real business systems, and
              the network you need to innovate and lead in the digital economy.
            </p>
          </div>

          <div data-testid="vision-card" className="surface-card p-8 md:p-10">
            <div className="w-12 h-12 rounded-2xl bg-[#FBBF24]/15 border border-[#FBBF24]/30 grid place-items-center mb-6">
              <Eye size={22} className="text-[#FBBF24]" />
            </div>
            <div className="text-xs uppercase tracking-[0.25em] text-white/50 font-bold">
              Vision
            </div>
            <h3 className="mt-3 font-display text-2xl md:text-3xl font-bold leading-tight text-white">
              A community of tech-savvy leaders shaping AI-driven entrepreneurship.
            </h3>
            <p className="mt-4 text-white/60 leading-relaxed">
              Building tomorrow&apos;s founders, product thinkers, and consultants — the people
              turning AI from a buzzword into revenue, jobs, and impact.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
