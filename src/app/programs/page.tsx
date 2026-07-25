"use client";

import React, { useState, useCallback } from "react";
import Navbar from "@/components/weaz/Navbar";
import PageHeader from "@/components/weaz/PageHeader";
import ProgramsOrbit from "@/components/weaz/ProgramsOrbit";
import FinalCTA from "@/components/weaz/FinalCTA";
import Footer from "@/components/weaz/Footer";
import LeadModal from "@/components/weaz/LeadModal";
import WhatsAppFab from "@/components/weaz/WhatsAppFab";
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Star,
  Award,
  Zap,
  Globe,
  MousePointerClick,
  ClipboardCheck,
  GraduationCap,
} from "lucide-react";

interface ProgramDetail {
  id: string;
  name: string;
  tagline: string;
  audience: string;
  duration: string;
  fee: string;
  benefit: string;
  popular?: boolean;
  accent: string;
  image: string;
  description: string;
  coreCurriculum: { title: string; items: string[] }[];
  webinarModules: string[];
  outcomes: string[];
}

const programsData: ProgramDetail[] = [
  {
    id: "beginner",
    name: "Digital Journey Begins",
    tagline: "From Beginner to Job & Entrepreneurship Ready",
    audience: "Beginner students & fresh graduates",
    duration: "6 Months",
    fee: "₹35,000",
    benefit: "Job Guarantee",
    popular: false,
    accent: "#9B59D0",
    image: "/images/team-collaboration.jpg",
    description:
      "A comprehensive six-month program designed to take learners from zero experience to job readiness. Combines digital marketing skills, basic business knowledge, AI fundamentals, mentorship, and career placement support.",
    coreCurriculum: [
      {
        title: "Digital Fundamentals",
        items: [
          "Internet & social media fundamentals",
          "Digital marketing basics & platforms",
          "Online communication & promotion strategies",
        ],
      },
      {
        title: "Business Foundations",
        items: [
          "Business planning & financial basics",
          "Business operations & structures",
          "Planning a digital business model",
        ],
      },
      {
        title: "AI Introduction",
        items: [
          "Fundamentals of AI & business applications",
          "Introduction to AI tools for productivity",
          "How AI supports modern digital businesses",
        ],
      },
      {
        title: "Project Work & Mentorship",
        items: [
          "Building a digital business model under 1:1 guidance",
          "Applying digital & AI knowledge to real scenarios",
          "Developing project work for a professional portfolio",
        ],
      },
      {
        title: "Career Support",
        items: [
          "Resume & LinkedIn optimization",
          "Interview preparation & mock sessions",
          "Job-placement assistance & professional guidance",
        ],
      },
    ],
    webinarModules: [
      "Market Mapping",
      "Competitor Decoding",
      "Brand DNA Creation",
      "Growth Strategy Lab",
      "Revenue Planning System",
    ],
    outcomes: [
      "Understand core digital marketing & social channels",
      "Use common digital & AI tools for daily business tasks",
      "Prepare a basic business plan & digital business model",
      "Build a portfolio project & apply for entry-level digital roles",
    ],
  },
  {
    id: "professional",
    name: "One Step to Business",
    tagline: "Business Scaling with Advanced Marketing & AI",
    audience: "Professional business owners, founders & growth professionals",
    duration: "Flexible",
    fee: "₹49,999",
    benefit: "Business Scaling",
    popular: false,
    accent: "#FBBF24",
    image: "/images/stage-event.jpg",
    description:
      "An advanced and strategically focused program created for aspiring and established business owners who want to scale their companies through digital marketing mastery, AI tools, customer acquisition, automation, and live consulting projects.",
    coreCurriculum: [
      {
        title: "Advanced Digital Marketing",
        items: [
          "Search Engine Optimization (SEO) domination",
          "Search Engine Marketing (SEM) & paid campaign planning",
          "Content strategy & online brand visibility",
        ],
      },
      {
        title: "Business Growth Strategies",
        items: [
          "Business scaling & funding strategies",
          "Repeatable customer-acquisition funnels",
          "Revenue growth & market expansion planning",
        ],
      },
      {
        title: "AI Tools for Business",
        items: [
          "Business operations automation with AI",
          "Analytics & customer insights",
          "AI-assisted strategic decision-making",
        ],
      },
      {
        title: "Leadership & Management",
        items: [
          "Team building & AI-supported operations",
          "Managing teams, budgets, and growth projects",
          "Executive decision-making frameworks",
        ],
      },
      {
        title: "Real Business Projects",
        items: [
          "Live consulting assignments with real client briefs",
          "Real business case studies & problem solving",
          "Applying marketing & AI tools to actual business growth",
        ],
      },
    ],
    webinarModules: [
      "Content Machine",
      "SEO Domination",
      "Performance Marketing Lab",
      "Data Intelligence",
      "Growth Accelerator",
    ],
    outcomes: [
      "Build a stronger, high-converting digital presence",
      "Develop automated, repeatable content systems",
      "Manage digital advertising campaigns with high ROI",
      "Automate repetitive operational tasks with AI tools",
    ],
  },
  {
    id: "ai-hero",
    name: "AI Hero",
    tagline: "Build. Automate. Scale.",
    audience: "Future AI leaders, entrepreneurs & technology builders",
    duration: "3 Months",
    fee: "₹60,000",
    benefit: "Most Intensive",
    popular: true,
    accent: "#9B59D0",
    image: "/images/purple-texture.jpg",
    description:
      "An intensive AI-focused program designed to equip learners with advanced artificial intelligence knowledge, tools, data capabilities, product-building experience, and real-world capstone project exposure.",
    coreCurriculum: [
      {
        title: "AI Foundations",
        items: [
          "Machine learning concepts & systems overview",
          "Natural Language Processing (NLP) & LLMs",
          "Computer vision & business AI applications",
        ],
      },
      {
        title: "AI Product Development",
        items: [
          "Building AI-driven products & services",
          "Identifying high-value AI use cases",
          "Connecting AI capabilities to business requirements & prototyping",
        ],
      },
      {
        title: "Data Strategy",
        items: [
          "Data collection, cleaning, and preparation",
          "Data analysis & visualization",
          "Using data to support AI & executive decision-making",
        ],
      },
      {
        title: "AI Ethics & Governance",
        items: [
          "Responsible AI innovation & safety",
          "AI governance & ethical usage policies",
          "Leadership in corporate AI adoption",
        ],
      },
      {
        title: "Capstone Project",
        items: [
          "Deliver a fully functional AI-powered solution",
          "Present capstone to industry mentors & investors",
          "Deploy AI solution to production or portfolio",
        ],
      },
    ],
    webinarModules: [
      "Digital Asset Building",
      "AI Productivity Stack",
      "Social Growth Framework",
    ],
    outcomes: [
      "Master machine learning, NLP, and computer vision concepts",
      "Build & prototype functional AI products or services",
      "Implement data collection, analysis & AI automation workflows",
      "Deliver a portfolio-ready functional AI capstone project",
    ],
  },
];

const steps = [
  { n: "01", label: "Visit Our Website", desc: "Explore program options or contact our admissions team.", icon: Globe },
  { n: "02", label: "Choose Your Program", desc: "Select Digital Journey Begins, One Step to Business, or AI Hero.", icon: MousePointerClick },
  { n: "03", label: "Apply Online", desc: "Fill in your background, learning goal, and contact details.", icon: ClipboardCheck },
  { n: "04", label: "Start Learning", desc: "Gain instant access to tools, cohorts, and 1:1 mentorship.", icon: GraduationCap },
];

export default function ProgramsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [defaultProgram, setDefaultProgram] = useState("");

  const openModal = useCallback((program = "") => {
    setDefaultProgram(program);
    setModalOpen(true);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#0F0B14] text-white overflow-x-hidden">
      <Navbar onEnroll={() => openModal("")} />

      <main className="relative z-10">
        <PageHeader
          badge="WEAZ TECH Curricula"
          title="Digital Entrepreneurship & AI Programs"
          subtitle="Three principal programs tailored for beginners, business owners, and AI innovators."
          description="Combining instructor-led training, hands-on projects, 1:1 mentorship, live case studies, and access to modern AI productivity stacks."
        />

        {/* Orbit Overview */}
        <ProgramsOrbit onEnroll={(p) => openModal(p)} />

        {/* Detailed Program Deep Dives */}
        <section className="py-20 md:py-28 relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-3xl mb-16">
              <div className="text-xs uppercase tracking-[0.25em] text-[#FBBF24] font-bold mb-3">
                Full Program Breakdown
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-black text-white">
                Detailed Course Specifications
              </h2>
            </div>

            <div className="space-y-24">
              {programsData.map((prog, idx) => {
                const flipped = idx % 2 === 1;
                return (
                  <div
                    key={prog.id}
                    id={`program-${prog.id}`}
                    className="surface-card p-8 md:p-14 border-white/10"
                  >
                    <div className="grid lg:grid-cols-12 gap-10 items-start">
                      {/* Left: Info Header */}
                      <div className="lg:col-span-7">
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                          <span
                            className="px-3.5 py-1 rounded-full text-xs uppercase tracking-widest font-bold"
                            style={{
                              background: `${prog.accent}18`,
                              border: `1px solid ${prog.accent}55`,
                              color: prog.accent,
                            }}
                          >
                            {prog.audience}
                          </span>
                          <span className="text-xs text-white/50 flex items-center gap-1">
                            <Clock size={13} /> {prog.duration}
                          </span>
                          <span className="text-xs font-bold text-[#FBBF24]">
                            {prog.benefit}
                          </span>
                        </div>

                        <h3 className="font-display text-3xl md:text-5xl font-black text-white">
                          {prog.name}
                        </h3>
                        <div className="text-lg font-medium text-white/60 mt-1">
                          {prog.tagline}
                        </div>

                        <p className="mt-6 text-white/70 text-base leading-relaxed">
                          {prog.description}
                        </p>

                        {/* Core Curriculum Grid */}
                        <div className="mt-8 space-y-6">
                          <div className="text-xs uppercase tracking-widest font-bold text-white/50">
                            Core Curriculum Modules
                          </div>
                          <div className="grid sm:grid-cols-2 gap-6">
                            {prog.coreCurriculum.map((module) => (
                              <div key={module.title} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                <div className="font-display text-sm font-bold text-white mb-2">
                                  {module.title}
                                </div>
                                <ul className="space-y-1.5">
                                  {module.items.map((item) => (
                                    <li key={item} className="flex items-start gap-2 text-xs text-white/70">
                                      <CheckCircle2
                                        size={13}
                                        style={{ color: prog.accent }}
                                        className="mt-0.5 shrink-0"
                                      />
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right: Pricing, Highlight Modules & Image */}
                      <div className="lg:col-span-5 space-y-6">
                        <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 relative">
                          <img
                            src={prog.image}
                            alt={prog.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0F0B14] via-transparent to-transparent" />
                        </div>

                        <div className="p-6 rounded-2xl bg-black/40 border border-white/10">
                          <div className="text-xs uppercase tracking-widest text-white/50">
                            Published Fee
                          </div>
                          <div className="mt-1 flex items-baseline gap-2">
                            <span className="font-display text-4xl font-black text-white">
                              {prog.fee}
                            </span>
                            <span className="text-sm text-white/50">
                              / {prog.duration}
                            </span>
                          </div>

                          <div className="mt-4 pt-4 border-t border-white/5">
                            <div className="text-xs uppercase tracking-widest text-white/50 mb-3 font-bold">
                              Featured Modules
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {prog.webinarModules.map((wm) => (
                                <span
                                  key={wm}
                                  className="px-3 py-1 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-white/80"
                                >
                                  {wm}
                                </span>
                              ))}
                            </div>
                          </div>

                          <button
                            onClick={() => openModal(prog.name)}
                            className="mt-6 w-full pill-gold py-3.5 text-sm font-bold inline-flex items-center justify-center gap-2 cursor-pointer"
                          >
                            Apply for {prog.name} <ArrowRight size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Side-by-Side Matrix Table */}
        <section className="py-20 md:py-28 relative border-t border-white/5 bg-[#0A0710]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-3xl mb-14">
              <div className="text-xs uppercase tracking-[0.25em] text-[#9B59D0] font-bold mb-3">
                Quick Comparison
              </div>
              <h2 className="font-display text-3xl md:text-5xl font-bold text-white">
                Program Matrix Overview
              </h2>
            </div>

            <div className="surface-card overflow-x-auto border-white/10">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    <th className="p-5 font-display text-sm font-bold text-white">Program</th>
                    <th className="p-5 font-display text-sm font-bold text-white">Target Audience</th>
                    <th className="p-5 font-display text-sm font-bold text-white">Main Coverage</th>
                    <th className="p-5 font-display text-sm font-bold text-white">Duration</th>
                    <th className="p-5 font-display text-sm font-bold text-white">Fee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {programsData.map((p) => (
                    <tr key={p.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="p-5 font-bold text-white">{p.name}</td>
                      <td className="p-5 text-white/70 text-xs">{p.audience}</td>
                      <td className="p-5 text-white/60 text-xs max-w-xs">{p.description}</td>
                      <td className="p-5 font-mono text-white/80">{p.duration}</td>
                      <td className="p-5 font-bold text-[#FBBF24]">{p.fee}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 4-Step Enrollment Process */}
        <section className="py-20 md:py-28 relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-3xl mb-14 text-center mx-auto">
              <div className="text-xs uppercase tracking-[0.25em] text-[#FBBF24] font-bold mb-3">
                Enrollment Journey
              </div>
              <h2 className="font-display text-3xl md:text-5xl font-bold text-white">
                4 Steps to Start Your Journey
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((s) => (
                <div key={s.n} className="surface-card p-6 border-white/10 relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#9B59D0]/15 border border-[#9B59D0]/30 grid place-items-center">
                      <s.icon size={18} className="text-[#9B59D0]" />
                    </div>
                    <span className="text-xs font-bold text-white/40 uppercase tracking-widest">
                      Step {s.n}
                    </span>
                  </div>
                  <h4 className="font-display text-lg font-bold text-white mb-2">{s.label}</h4>
                  <p className="text-xs text-white/60 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <FinalCTA onEnroll={() => openModal("")} />
        <Footer />
      </main>

      <LeadModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        defaultProgram={defaultProgram}
      />
      <WhatsAppFab />
    </div>
  );
}
