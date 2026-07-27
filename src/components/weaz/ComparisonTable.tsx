"use client";

import React from "react";
import { Check, Star, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/FadeIn";
import { ShineButton } from "@/components/ui/ShineButton";

interface ComparisonTableProps {
  onEnroll: (program: string) => void;
}

const rows = [
  {
    id: "beginner",
    name: "Beginner Program",
    features: [
      "Digital fundamentals",
      "Business foundations",
      "AI intro",
      "Career support & job placement",
    ],
    price: "₹35,000",
    duration: "6 Months",
    highlight: "Job Guarantee",
    popular: false,
    color: "#9B59D0",
  },
  {
    id: "professional",
    name: "Professional Business Owner",
    features: [
      "Advanced marketing (SEO/SEM)",
      "AI tools for business",
      "Growth strategies",
      "Live case studies",
    ],
    price: "₹49,999",
    duration: "Flexible",
    highlight: "Business Scaling",
    popular: false,
    color: "#FBBF24",
  },
  {
    id: "ai-hero",
    name: "AI Hero Program",
    features: [
      "Machine learning",
      "AI product development",
      "Data strategy",
      "Ethics & capstone project",
    ],
    price: "₹60,000",
    duration: "3 Months",
    highlight: "Most Intensive",
    popular: true,
    color: "#9B59D0",
  },
];

const ComparisonTable = ({ onEnroll }: ComparisonTableProps) => {
  return (
    <section id="pricing" data-testid="pricing-section" className="relative py-24 md:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <FadeIn direction="up">
          <div className="max-w-3xl">
            <div className="text-xs uppercase tracking-[0.25em] text-[#9B59D0] font-bold mb-4">
              Compare Programs
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-white">
              Pick your path.
              <br />
              <span className="text-white/60">Own the outcome.</span>
            </h2>
          </div>
        </FadeIn>

        <StaggerContainer staggerChildren={0.12} className="mt-14 grid md:grid-cols-3 gap-6">
          {rows.map((r) => (
            <StaggerItem key={r.id} direction="up">
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ duration: 0.3 }}
                data-testid={`pricing-card-${r.id}`}
                className={`surface-card p-8 flex flex-col h-full ${
                  r.popular
                    ? "border-[#9B59D0] shadow-[0_20px_80px_-20px_rgba(155,89,208,0.4)]"
                    : ""
                }`}
              >
                {r.popular && (
                  <div className="absolute top-6 right-6 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#9B59D0] text-white text-[10px] uppercase tracking-widest font-bold shadow-md">
                    <Star size={11} fill="currentColor" />
                    Most Intensive
                  </div>
                )}

                <div
                  className="text-xs uppercase tracking-[0.25em] font-bold"
                  style={{ color: r.color }}
                >
                  {r.highlight}
                </div>
                <h3 className="mt-3 font-display text-2xl font-bold text-white">{r.name}</h3>

                <div className="mt-6 flex items-baseline gap-2">
                  <div className="font-display text-4xl font-black text-white">{r.price}</div>
                  <div className="text-white/50 text-sm">/ {r.duration}</div>
                </div>

                <div className="mt-6 h-px bg-white/5" />

                <ul className="mt-6 space-y-3 flex-1">
                  {r.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-white/80">
                      <Check size={16} style={{ color: r.color }} className="mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <ShineButton
                  data-testid={`pricing-enroll-${r.id}`}
                  onClick={() => onEnroll(r.name)}
                  variant={r.popular ? "gold" : "purple"}
                  className="mt-8 w-full py-3.5 text-sm font-bold"
                >
                  Enroll Now <ArrowRight size={15} />
                </ShineButton>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <FadeIn direction="up" delay={0.2}>
          <p data-testid="pricing-footnote" className="mt-8 text-sm text-white/50 text-center">
            All programs include mentorship, hands-on projects &amp; access to AI tools &amp; resources.
          </p>
        </FadeIn>
      </div>
    </section>
  );
};

export default ComparisonTable;
