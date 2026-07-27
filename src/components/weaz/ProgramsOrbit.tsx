"use client";

import React from "react";
import { GraduationCap, Briefcase, Cpu } from "lucide-react";
import { motion } from "framer-motion";
import { FadeIn } from "@/components/ui/FadeIn";

interface ProgramsOrbitProps {
  onEnroll: (program: string) => void;
}

const nodes = [
  {
    id: "beginner",
    title: "Beginner Students & Freshers",
    tagline: "Digital Journey Begins",
    icon: GraduationCap,
    color: "#9B59D0",
  },
  {
    id: "professional",
    title: "Professional Business Owner",
    tagline: "One Step to Business",
    icon: Briefcase,
    color: "#FBBF24",
  },
  {
    id: "ai-hero",
    title: "AI Hero",
    tagline: "Build. Automate. Scale.",
    icon: Cpu,
    color: "#9B59D0",
  },
];

const ProgramsOrbit = ({ onEnroll }: ProgramsOrbitProps) => {
  return (
    <section id="programs" data-testid="programs-orbit-section" className="relative py-24 md:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <FadeIn direction="up">
          <div className="max-w-3xl mx-auto text-center">
            <div className="text-xs uppercase tracking-[0.25em] text-[#9B59D0] font-bold mb-4">
              Our Programs
            </div>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white">
              At a Glance
            </h2>
            <p className="mt-6 text-white/60">
              Three focused tracks. One transformation. Pick the one that meets you where you are.
            </p>
          </div>
        </FadeIn>

        {/* Orbit graphic */}
        <div className="relative mt-16 md:mt-24 mx-auto" style={{ maxWidth: 900 }}>
          <div className="relative aspect-square">
            {/* Rings */}
            <div className="absolute inset-0 rounded-full border border-white/10" />
            <div className="absolute inset-[8%] rounded-full border border-white/[0.06]" />
            <div className="absolute inset-[18%] rounded-full border border-dashed border-[#9B59D0]/30 orbit-ring gpu-accelerated" />

            {/* Center */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="absolute inset-[30%] rounded-full bg-gradient-to-br from-[#9B59D0]/25 via-[#0F0B14] to-[#FBBF24]/15 border border-white/10 grid place-items-center cursor-default shadow-2xl"
            >
              <div className="text-center px-4">
                <div className="font-display text-2xl md:text-4xl font-black tracking-tight text-white">
                  WEAZ
                </div>
                <div className="text-[10px] md:text-xs uppercase tracking-[0.3em] text-white/50 mt-1">
                  AI-First Learning
                </div>
              </div>
            </motion.div>

            {/* Nodes positioned around the orbit */}
            {nodes.map((n, idx) => {
              const positions = [
                { top: "2%", left: "50%" },
                { bottom: "10%", left: "8%" },
                { bottom: "10%", right: "8%" },
              ];
              const style = positions[idx];
              const Icon = n.icon;
              return (
                <motion.button
                  key={n.id}
                  onClick={() => onEnroll(n.title)}
                  data-testid={`orbit-node-${n.id}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.15 }}
                  whileHover={{ scale: 1.06, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  className="absolute cursor-pointer group z-20"
                  style={{
                    ...style,
                    transform:
                      idx === 0
                        ? "translate(-50%, 0)"
                        : "translate(0, 0)",
                  }}
                >
                  <div className="surface-card p-4 md:p-5 w-40 md:w-56 text-left hover:border-white/30 transition-all shadow-xl">
                    <div
                      className="w-10 h-10 rounded-xl grid place-items-center mb-3 transition-transform group-hover:scale-110"
                      style={{
                        background: `${n.color}22`,
                        border: `1px solid ${n.color}55`,
                      }}
                    >
                      <Icon size={18} style={{ color: n.color }} />
                    </div>
                    <div className="font-display text-sm md:text-base font-bold leading-tight text-white group-hover:text-[#FBBF24] transition-colors">
                      {n.title}
                    </div>
                    <div className="text-[11px] md:text-xs text-white/50 mt-1">{n.tagline}</div>
                  </div>
                </motion.button>
              );
            })}

            {/* Center glow */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-[#9B59D0]/30 blur-[100px] pointer-events-none" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProgramsOrbit;
