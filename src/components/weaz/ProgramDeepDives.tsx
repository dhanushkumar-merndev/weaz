"use client";

import React from "react";
import { CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { FadeIn } from "@/components/ui/FadeIn";
import { ShineButton } from "@/components/ui/ShineButton";

interface ProgramDeepDivesProps {
  onEnroll: (program: string) => void;
}

interface Program {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  description: string;
  modules: string[];
  curriculum: string[];
  image: string;
  accent: string;
}

const programs: Program[] = [
  {
    id: "beginner",
    tag: "6-Month Curriculum",
    title: "Beginner Students & Freshers",
    subtitle: "Digital Journey Begins",
    description:
      "A comprehensive 6-month curriculum designed to take you from zero to job-ready — blending digital skills, business foundations, and AI fundamentals with hands-on mentorship.",
    modules: [
      "Market Mapping",
      "Competitor Decoding",
      "Brand DNA Creation",
      "Growth Strategy Lab",
      "Revenue Planning System",
    ],
    curriculum: [
      "Digital Fundamentals (internet, social media, digital marketing basics)",
      "Business Foundations (planning, finance, operations)",
      "AI Introduction (basics of AI & business applications)",
      "Project Work (build a digital business model with mentorship)",
      "Career Support (resume building, interview prep, job placement)",
    ],
    image: "/images/team-collaboration.jpg",
    accent: "#9B59D0",
  },
  {
    id: "professional",
    tag: "For Founders & Owners",
    title: "Professional Business Owner",
    subtitle: "One Step to Business",
    description:
      "Advanced, strategic modules designed for established and aspiring business owners ready to scale with AI-driven tools, digital marketing mastery, and real-world consulting projects.",
    modules: [
      "Content Machine",
      "SEO Domination",
      "Performance Marketing Lab",
      "Data Intelligence",
      "Growth Accelerator",
    ],
    curriculum: [
      "Advanced Digital Marketing (SEO, SEM, content strategy)",
      "Business Growth Strategies (scaling, funding, customer acquisition)",
      "AI Tools for Business (automation, analytics, customer insights)",
      "Leadership & Management (team building, AI decision-making)",
      "Real Business Projects (live consulting & case studies)",
    ],
    image: "/images/stage-event.jpg",
    accent: "#FBBF24",
  },
  {
    id: "ai-hero",
    tag: "3-Month Intensive",
    title: "AI Hero",
    subtitle: "Build. Automate. Scale.",
    description:
      "A 3-month intensive AI-focused program designed to equip future leaders with cutting-edge artificial intelligence skills, tools, and real-world project experience.",
    modules: [
      "Digital Asset Building",
      "AI Productivity Stack",
      "Social Growth Framework",
    ],
    curriculum: [
      "AI Foundations (machine learning, NLP, computer vision overview)",
      "AI Product Development (building AI-driven products/services)",
      "Data Strategy (data collection, cleaning, analysis)",
      "AI Ethics & Leadership (responsible innovation, AI governance)",
      "Capstone Project (deliver a fully functional AI solution)",
    ],
    image: "/images/purple-texture.jpg",
    accent: "#9B59D0",
  },
];

const DeepDive = ({
  p,
  index,
  onEnroll,
}: {
  p: Program;
  index: number;
  onEnroll: (program: string) => void;
}) => {
  const flipped = index % 2 === 1;
  return (
    <div
      id={`program-${p.id}`}
      data-testid={`program-deepdive-${p.id}`}
      className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center py-16 md:py-24"
    >
      <div className={`lg:col-span-6 ${flipped ? "lg:order-2" : ""}`}>
        <FadeIn direction={flipped ? "left" : "right"}>
          <div className="relative aspect-[5/6] rounded-[2rem] overflow-hidden border border-white/10 group shadow-2xl">
            <img
              src={p.image}
              alt={p.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F0B14] via-transparent to-transparent" />
            <div
              className="absolute inset-0 opacity-70"
              style={{
                background: `radial-gradient(ellipse at ${
                  flipped ? "left top" : "right top"
                }, ${p.accent}33, transparent 60%)`,
              }}
            />
            <div className="absolute bottom-6 left-6 right-6 flex items-center gap-3">
              <div
                className="w-2.5 h-2.5 rounded-full animate-pulse"
                style={{ background: p.accent }}
              />
              <span className="text-xs uppercase tracking-[0.25em] text-white/90 font-semibold">
                {p.tag}
              </span>
            </div>
          </div>
        </FadeIn>
      </div>

      <div className={`lg:col-span-6 ${flipped ? "lg:order-1" : ""}`}>
        <FadeIn direction={flipped ? "right" : "left"}>
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] uppercase tracking-[0.25em] font-bold"
            style={{
              background: `${p.accent}18`,
              border: `1px solid ${p.accent}55`,
              color: p.accent,
            }}
          >
            <Clock size={13} />
            {p.tag}
          </div>

          <h3 className="mt-5 font-display text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-white">
            {p.title}
          </h3>
          <div className="mt-2 text-lg md:text-xl text-white/60">{p.subtitle}</div>

          <p className="mt-6 text-white/70 leading-relaxed max-w-xl text-sm md:text-base">
            {p.description}
          </p>

          <div className="mt-8 grid sm:grid-cols-2 gap-6">
            <div>
              <div className="text-xs uppercase tracking-[0.25em] font-bold text-white/50 mb-3">
                Modules
              </div>
              <ul className="space-y-2">
                {p.modules.map((m) => (
                  <li key={m} className="flex items-start gap-2 text-sm text-white/80">
                    <span
                      className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: p.accent }}
                    />
                    {m}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.25em] font-bold text-white/50 mb-3">
                Curriculum
              </div>
              <ul className="space-y-2">
                {p.curriculum.map((c) => (
                  <li key={c} className="flex items-start gap-2 text-sm text-white/80">
                    <CheckCircle2
                      size={14}
                      style={{ color: p.accent }}
                      className="mt-0.5 shrink-0"
                    />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10">
            <ShineButton
              data-testid={`program-${p.id}-enroll-btn`}
              onClick={() => onEnroll(p.title)}
              variant="gold"
              className="px-7 py-3.5"
            >
              Apply for {p.title.split(" ")[0]} <ArrowRight size={16} />
            </ShineButton>
          </div>
        </FadeIn>
      </div>
    </div>
  );
};

const ProgramDeepDives = ({ onEnroll }: ProgramDeepDivesProps) => {
  return (
    <section data-testid="program-deepdives-section" className="relative py-16 md:py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <FadeIn direction="up">
          <div className="max-w-3xl">
            <div className="text-xs uppercase tracking-[0.25em] text-[#9B59D0] font-bold mb-4">
              Program Deep Dives
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-white">
              Choose Your Track
            </h2>
          </div>
        </FadeIn>
        <div className="mt-6 divide-y divide-white/5">
          {programs.map((p, i) => (
            <DeepDive key={p.id} p={p} index={i} onEnroll={onEnroll} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProgramDeepDives;
