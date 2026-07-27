"use client";

import React from "react";
import { Globe, MousePointerClick, ClipboardCheck, GraduationCap, ArrowRight, Zap } from "lucide-react";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/FadeIn";
import { ShineButton } from "@/components/ui/ShineButton";

interface FinalCTAProps {
  onEnroll: () => void;
}

const steps = [
  { n: "01", label: "Visit Our Website", icon: Globe },
  { n: "02", label: "Choose Your Program", icon: MousePointerClick },
  { n: "03", label: "Apply Online", icon: ClipboardCheck },
  { n: "04", label: "Start Learning", icon: GraduationCap },
];

const FinalCTA = ({ onEnroll }: FinalCTAProps) => {
  return (
    <section data-testid="final-cta-section" className="relative py-24 md:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <FadeIn direction="up">
          <div className="relative surface-card p-8 md:p-16 overflow-hidden border-white/15 shadow-2xl">
            <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#9B59D0]/25 blur-[100px] pointer-events-none" />
            <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-[#FBBF24]/15 blur-[100px] pointer-events-none" />

            <div className="relative z-10 max-w-4xl">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FBBF24]/10 border border-[#FBBF24]/30 text-[11px] uppercase tracking-[0.25em] font-bold text-[#FBBF24]">
                <Zap size={13} /> Limited Seats Available
              </div>
              <h2 className="mt-6 font-display text-4xl md:text-6xl font-black tracking-tight leading-[0.95] text-white">
                Ready to join <span className="text-[#9B59D0]">WEAZ</span> Tech?
              </h2>
              <p className="mt-6 text-white/70 text-lg max-w-2xl leading-relaxed">
                Take the leap. Transform your future with WEAZ Tech. Your journey to digital
                entrepreneurship and AI mastery starts with a single step. Enroll today and become
                the leader of tomorrow.
              </p>

              <StaggerContainer staggerChildren={0.1} className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {steps.map((s, idx) => (
                  <StaggerItem key={s.n} direction="up">
                    <div
                      data-testid={`final-step-${idx + 1}`}
                      className="relative p-5 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-[#FBBF24]/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#9B59D0]/15 border border-[#9B59D0]/30 grid place-items-center">
                          <s.icon size={16} className="text-[#9B59D0]" />
                        </div>
                        <div className="text-xs uppercase tracking-[0.25em] text-white/50 font-bold">
                          Step {s.n}
                        </div>
                      </div>
                      <div className="mt-4 font-display text-lg font-bold text-white">{s.label}</div>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>

              <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <ShineButton
                  data-testid="final-cta-enroll-btn"
                  onClick={onEnroll}
                  variant="gold"
                  className="px-8 py-4 text-base"
                >
                  Enroll Now <ArrowRight size={18} />
                </ShineButton>
                <div className="text-sm text-white/60">
                  <span className="text-[#FBBF24] font-bold">Limited Seats Available</span> — Priority
                  interviews open now.
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default FinalCTA;
