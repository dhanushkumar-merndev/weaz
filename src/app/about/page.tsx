"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import gsap from "gsap";
import Navbar from "@/components/weaz/Navbar";
import PageHeader from "@/components/weaz/PageHeader";
import FinalCTA from "@/components/weaz/FinalCTA";
import Footer from "@/components/weaz/Footer";
import { EnrollmentModal } from "@/components/weaz/EnrollmentModal";
import WhatsAppFab from "@/components/weaz/WhatsAppFab";
import { GsapReveal } from "@/components/ui/GsapReveal";
import {
  Target,
  Eye,
  Zap,
  Cpu,
  Users,
  ShieldCheck,
  CheckCircle2,
  BookOpen,
  GraduationCap,
  Briefcase,
  Rocket,
  Award,
  Layers,
  ArrowRight,
} from "lucide-react";

const valuePropositions = [
  "Understand digital marketing and online business fundamentals.",
  "Build strong business foundations, financial planning, and operations.",
  "Learn practical applications of artificial intelligence in daily business.",
  "Create digital assets and AI-powered solutions from scratch.",
  "Improve employability and entrepreneurial readiness for the modern economy.",
  "Build real-world projects and portfolio-ready work for career advancement.",
  "Develop repeatable customer-acquisition and growth strategies.",
  "Automate business operations with modern AI tools and stacks.",
  "Learn directly from experienced mentors, industry leaders, and AI specialists.",
  "Prepare for digital careers, consulting roles, entrepreneurship, or startup creation.",
];

const targetAudiences = [
  {
    icon: GraduationCap,
    title: "Students & Freshers",
    color: "#9B59D0",
    desc: "Beginners, graduates, and job seekers looking to enter the digital economy.",
    bullets: [
      "Digital marketing & social media fundamentals",
      "Business & financial basics",
      "AI productivity intro & project work",
      "Resume, interview & career placement support",
    ],
  },
  {
    icon: Rocket,
    title: "Aspiring Entrepreneurs",
    color: "#FBBF24",
    desc: "Individuals planning to start a business or validate a new product idea.",
    bullets: [
      "Market mapping & competitor decoding",
      "Brand DNA creation & positioning",
      "Revenue planning & customer acquisition",
      "AI-assisted business operations",
    ],
  },
  {
    icon: Briefcase,
    title: "Existing Business Owners",
    color: "#9B59D0",
    desc: "Established founders seeking to scale revenue and automate workflows.",
    bullets: [
      "Advanced digital marketing (SEO/SEM)",
      "Performance marketing & content machines",
      "AI automation & data intelligence",
      "Leadership, team building & scaling strategies",
    ],
  },
  {
    icon: Cpu,
    title: "AI Learners & Future Leaders",
    color: "#FBBF24",
    desc: "Technology enthusiasts aiming to build AI products and lead responsibly.",
    bullets: [
      "Machine learning, NLP & vision overview",
      "AI product prototyping & data strategy",
      "Responsible AI ethics & governance",
      "Capstone project delivering functional AI solutions",
    ],
  },
];

const methodologies = [
  { name: "Instructor-Led Learning", desc: "Structured sessions explaining concepts, frameworks, and strategy." },
  { name: "Practical Training", desc: "Hands-on exercises, digital campaigns, business plans, and AI tools." },
  { name: "Mentorship", desc: "Direct guidance through project execution, business challenges, and career prep." },
  { name: "Real-World Projects", desc: "Live assignments designed to construct a portfolio-ready resume." },
  { name: "Business Case Studies", desc: "Work with scenarios based on actual client briefs and business growth models." },
  { name: "AI Tool Access", desc: "Hands-on exposure to premium AI productivity stacks and automation engines." },
  { name: "Career Support", desc: "Resume building, 1:1 interview prep, portfolio reviews, and job matching." },
  { name: "Capstone Learning", desc: "Deliver a fully functional AI project or real business growth system." },
];

const skillsGrid = [
  {
    category: "Digital Skills",
    color: "#9B59D0",
    items: [
      "Internet & Social Media Fundamentals",
      "Digital Marketing Strategy",
      "Search Engine Optimization (SEO)",
      "Search Engine Marketing (SEM)",
      "Content Strategy & Creation",
      "Performance Advertising (Meta/Google)",
      "Online Brand Building",
      "Digital Asset Development",
    ],
  },
  {
    category: "Business Skills",
    color: "#FBBF24",
    items: [
      "Business Planning & Operations",
      "Basic Financial & Unit Economics",
      "Competitor Decoding & Market Mapping",
      "Brand DNA & Value Proposition",
      "Revenue Planning Systems",
      "Customer Acquisition & Growth",
      "Business Scaling & Funding Strategy",
      "Team Leadership & Management",
    ],
  },
  {
    category: "AI & Technology Skills",
    color: "#9B59D0",
    items: [
      "AI Fundamentals & Business Use Cases",
      "Machine Learning Overview",
      "Natural Language Processing (NLP)",
      "Computer Vision Concepts",
      "AI Product Development & Prototyping",
      "Business & Workflow Automation",
      "Data Strategy & Customer Analytics",
      "AI Ethics, Responsible AI & Governance",
    ],
  },
  {
    category: "Career & Leadership Skills",
    color: "#FBBF24",
    items: [
      "Resume & LinkedIn Optimization",
      "1:1 Interview Preparation",
      "Public Portfolio Development",
      "Project Presentation & Pitching",
      "Business Communication",
      "Problem Solving & Analytical Thinking",
      "Entrepreneurial Readiness",
      "Consulting & Leadership Skills",
    ],
  },
];

export default function AboutPage() {
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
          badge="About WEAZ TECH"
          title="Learn. Build. Grow. Lead with AI."
          subtitle="Combining digital education, business development, marketing, automation, and artificial intelligence."
          description="WEAZ TECH is a digital entrepreneurship and artificial intelligence training organization created to prepare students, fresh graduates, aspiring entrepreneurs, and business owners for real business results in the modern digital economy."
        />

        {/* Mission & Vision */}
        <section id="mission-vision" className="relative py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-6">
            <GsapReveal className="grid md:grid-cols-2 gap-8" stagger={0.15}>
              <div data-testid="mission-card" className="surface-card p-8 md:p-12 border-white/10">
                <div className="w-14 h-14 rounded-2xl bg-[#9B59D0]/15 border border-[#9B59D0]/30 grid place-items-center mb-6">
                  <Target size={26} className="text-[#9B59D0]" />
                </div>
                <div className="text-xs uppercase tracking-[0.25em] text-[#9B59D0] font-bold">
                  Our Mission
                </div>
                <h3 className="mt-3 font-display text-2xl md:text-3xl font-bold leading-tight text-white">
                  To empower aspiring entrepreneurs with cutting-edge digital and AI skills so they can innovate and lead in the digital economy.
                </h3>
                <p className="mt-4 text-white/60 leading-relaxed text-sm">
                  Our mission focuses on making learners capable of applying digital technology and AI to real business problems, entrepreneurial opportunities, marketing, automation, decision-making, and scaling.
                </p>
              </div>

              <div data-testid="vision-card" className="surface-card p-8 md:p-12 border-white/10">
                <div className="w-14 h-14 rounded-2xl bg-[#FBBF24]/15 border border-[#FBBF24]/30 grid place-items-center mb-6">
                  <Eye size={26} className="text-[#FBBF24]" />
                </div>
                <div className="text-xs uppercase tracking-[0.25em] text-[#FBBF24] font-bold">
                  Our Vision
                </div>
                <h3 className="mt-3 font-display text-2xl md:text-3xl font-bold leading-tight text-white">
                  To create a community of technology-aware business leaders who shape the future through AI-driven entrepreneurship.
                </h3>
                <p className="mt-4 text-white/60 leading-relaxed text-sm">
                  We aim to develop leaders who can use technology confidently, build sustainable businesses, manage teams, make data-informed decisions, and create AI-powered products and services.
                </p>
              </div>
            </GsapReveal>
          </div>
        </section>

        {/* Company Description & Overview */}
        <section className="py-20 md:py-28 relative border-t border-white/5 bg-[#0A0710]">
          <div className="max-w-7xl mx-auto px-6">
            <GsapReveal className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <div className="text-xs uppercase tracking-[0.25em] text-[#FBBF24] font-bold mb-4">
                Company Description
              </div>
              <h2 className="font-display text-3xl md:text-5xl font-black text-white leading-tight">
                Practical Education for the Modern Digital Economy
              </h2>
              <p className="mt-6 text-white/70 leading-relaxed">
                WEAZ TECH (also represented through WEAZ Digital Connect) provides structured learning programs covering digital marketing, business fundamentals, entrepreneurship, artificial intelligence, automation, data strategy, business growth, leadership, and career development.
              </p>
              <p className="mt-4 text-white/60 leading-relaxed text-sm">
                We promote applied learning rather than theory alone. Our training approach includes 1:1 mentorship, hands-on exercises, business projects, live case studies, consulting assignments, access to digital and AI tool stacks, resume preparation, interview support, and portfolio development.
              </p>

              <div className="mt-8 grid sm:grid-cols-2 gap-3">
                {valuePropositions.slice(0, 6).map((vp) => (
                  <div key={vp} className="flex items-start gap-2.5 text-xs text-white/80">
                    <CheckCircle2 size={15} className="text-[#FBBF24] mt-0.5 shrink-0" />
                    <span>{vp}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="surface-card p-8 border-white/10 space-y-6">
                <h3 className="font-display text-2xl font-bold text-white">
                  Brand Identity
                </h3>
                <div className="space-y-4 text-sm text-white/70">
                  <div className="flex justify-between pb-3 border-b border-white/5">
                    <span className="text-white/40">Company Name</span>
                    <span className="font-bold text-white">WEAZ TECH</span>
                  </div>
                  <div className="flex justify-between pb-3 border-b border-white/5">
                    <span className="text-white/40">Brand Line</span>
                    <span className="font-semibold text-white">WEAZ Digital Connect</span>
                  </div>
                  <div className="flex justify-between pb-3 border-b border-white/5">
                    <span className="text-white/40">Tagline</span>
                    <span className="font-bold text-[#FBBF24]">Learn. Build. Grow. Lead with AI.</span>
                  </div>
                  <div className="flex justify-between pb-3 border-b border-white/5">
                    <span className="text-white/40">Program Category</span>
                    <span className="font-semibold text-white">Digital Entrepreneurship</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Core Theme</span>
                    <span className="font-semibold text-white">Upgrade skills for real business results</span>
                  </div>
                </div>
              </div>
            </div>
            </GsapReveal>
          </div>
        </section>

        {/* Target Audience */}
        <section className="py-20 md:py-28 relative">
          <div className="max-w-7xl mx-auto px-6">
            <GsapReveal>
              <div className="max-w-3xl mb-14">
                <div className="text-xs uppercase tracking-[0.25em] text-[#9B59D0] font-bold mb-3">
                  Who We Serve
                </div>
                <h2 className="font-display text-3xl md:text-5xl font-bold text-white">
                  Four Distinct Learner Groups
                </h2>
              </div>
            </GsapReveal>

            <GsapReveal className="grid md:grid-cols-2 lg:grid-cols-4 gap-6" stagger={0.1}>
              {targetAudiences.map((ta) => {
                const Icon = ta.icon;
                return (
                  <div key={ta.title} className="surface-card p-7 flex flex-col justify-between border-white/10">
                    <div>
                      <div
                        className="w-12 h-12 rounded-2xl grid place-items-center mb-6"
                        style={{
                          background: `${ta.color}15`,
                          border: `1px solid ${ta.color}35`,
                        }}
                      >
                        <Icon size={22} style={{ color: ta.color }} />
                      </div>
                      <h3 className="font-display text-xl font-bold text-white mb-2">{ta.title}</h3>
                      <p className="text-xs text-white/50 mb-6 leading-relaxed">{ta.desc}</p>

                      <ul className="space-y-2">
                        {ta.bullets.map((b) => (
                          <li key={b} className="flex items-start gap-2 text-xs text-white/80">
                            <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: ta.color }} />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      onClick={() => openModal(ta.title)}
                      className="mt-8 text-xs font-bold text-[#9B59D0] hover:text-[#FBBF24] inline-flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      Apply for {ta.title.split(" ")[0]} <ArrowRight size={13} />
                    </button>
                  </div>
                );
              })}
            </GsapReveal>
          </div>
        </section>

        {/* Training Methodology */}
        <section className="py-20 md:py-28 relative border-t border-white/5 bg-[#0A0710]">
          <div className="max-w-7xl mx-auto px-6">
            <GsapReveal>
              <div className="max-w-3xl mb-14">
                <div className="text-xs uppercase tracking-[0.25em] text-[#FBBF24] font-bold mb-3">
                  Learning Model
                </div>
                <h2 className="font-display text-3xl md:text-5xl font-bold text-white">
                  WEAZ TECH Training Methodology
                </h2>
              </div>
            </GsapReveal>

            <GsapReveal className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6" stagger={0.08}>
              {methodologies.map((m, idx) => (
                <div key={m.name} className="surface-card p-6 border-white/10">
                  <div className="text-xs font-mono text-[#FBBF24] mb-3">0{idx + 1}</div>
                  <h4 className="font-display text-lg font-bold text-white mb-2">{m.name}</h4>
                  <p className="text-xs text-white/60 leading-relaxed">{m.desc}</p>
                </div>
              ))}
            </GsapReveal>
          </div>
        </section>

        {/* Comprehensive Skills Matrix */}
        <section className="py-20 md:py-28 relative">
          <div className="max-w-7xl mx-auto px-6">
            <GsapReveal>
              <div className="max-w-3xl mb-14">
                <div className="text-xs uppercase tracking-[0.25em] text-[#9B59D0] font-bold mb-3">
                  Capabilities Matrix
                </div>
                <h2 className="font-display text-3xl md:text-5xl font-bold text-white">
                  Skills Covered Across Programs
                </h2>
              </div>
            </GsapReveal>

            <GsapReveal className="grid md:grid-cols-2 gap-8" stagger={0.1}>
              {skillsGrid.map((sg) => (
                <div key={sg.category} className="surface-card p-8 border-white/10">
                  <div
                    className="text-xs uppercase tracking-[0.2em] font-bold mb-4"
                    style={{ color: sg.color }}
                  >
                    {sg.category}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {sg.items.map((item) => (
                      <div key={item} className="flex items-start gap-2 text-xs text-white/80">
                        <CheckCircle2 size={14} style={{ color: sg.color }} className="mt-0.5 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </GsapReveal>
          </div>
        </section>

        <FinalCTA onEnroll={() => openModal("")} />
        <Footer />
      </main>

      <EnrollmentModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        defaultProgram={defaultProgram}
      />
      <WhatsAppFab />
    </div>
  );
}
