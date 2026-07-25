"use client";

import React from "react";
import { TrendingUp, Rocket, Users, LineChart, Award } from "lucide-react";

const pathways = [
  { label: "Digital Marketer", icon: TrendingUp },
  { label: "AI Consultant", icon: Award },
  { label: "Startup Founder", icon: Rocket },
  { label: "Business Analyst", icon: LineChart },
];

const highlights = [
  "Alumni launching AI-driven startups globally",
  "Mentorship from top industry leaders & AI specialists",
  "Real-world projects powering career-ready portfolios",
];

const CareerOutcomes = () => {
  return (
    <section id="outcomes" data-testid="outcomes-section" className="relative py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-7">
            <div className="text-xs uppercase tracking-[0.25em] text-[#9B59D0] font-bold mb-4">
              Career Outcomes
            </div>
            <h2
              data-testid="outcomes-stat"
              className="font-display font-black tracking-tighter leading-[0.9] text-[16vw] md:text-[10vw] lg:text-[9vw] text-white"
            >
              90%<span className="text-[#FBBF24]">+</span>
            </h2>
            <div className="mt-4 text-xl md:text-2xl text-white/70 max-w-xl">
              placement rate within <span className="text-white font-semibold">12 months</span>
            </div>
            <p className="mt-6 text-white/60 max-w-xl leading-relaxed">
              Over 90% of graduates secure entrepreneurial roles or launch startups within
              12 months of completing their WEAZ Tech program.
            </p>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="surface-card p-8">
              <div className="text-xs uppercase tracking-[0.25em] text-white/50 font-bold mb-6">
                Career Pathways
              </div>
              <div className="grid grid-cols-2 gap-3">
                {pathways.map((p) => (
                  <div
                    key={p.label}
                    data-testid={`pathway-${p.label.toLowerCase().replace(/\s+/g, "-")}`}
                    className="flex items-center gap-3 p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-[#9B59D0]/40 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#9B59D0]/15 border border-[#9B59D0]/30 grid place-items-center">
                      <p.icon size={16} className="text-[#9B59D0]" />
                    </div>
                    <div className="text-sm font-semibold text-white">{p.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="surface-card p-8">
              <div className="text-xs uppercase tracking-[0.25em] text-white/50 font-bold mb-4">
                Success Highlights
              </div>
              <ul className="space-y-3">
                {highlights.map((h) => (
                  <li key={h} className="flex items-start gap-3 text-sm text-white/80">
                    <Users size={15} className="text-[#FBBF24] mt-0.5 shrink-0" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CareerOutcomes;
