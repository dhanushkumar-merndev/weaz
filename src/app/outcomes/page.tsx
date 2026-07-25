"use client";

import React, { useState, useCallback } from "react";
import Navbar from "@/components/weaz/Navbar";
import PageHeader from "@/components/weaz/PageHeader";
import CareerOutcomes from "@/components/weaz/CareerOutcomes";
import Testimonials from "@/components/weaz/Testimonials";
import FinalCTA from "@/components/weaz/FinalCTA";
import Footer from "@/components/weaz/Footer";
import LeadModal from "@/components/weaz/LeadModal";
import WhatsAppFab from "@/components/weaz/WhatsAppFab";
import { TrendingUp, Briefcase, Award, Rocket, CheckCircle2, LineChart, ShieldCheck } from "lucide-react";

const primaryPathways = [
  { title: "Digital Marketer", desc: "Manage digital channels, SEO, SEM, social media, and campaign analytics.", icon: TrendingUp, color: "#9B59D0" },
  { title: "AI Consultant", desc: "Audit business workflows, deploy AI productivity stacks, and automate operations.", icon: Award, color: "#FBBF24" },
  { title: "Startup Founder", desc: "Validate market demand, create brand DNA, build AI products, and acquire customers.", icon: Rocket, color: "#9B59D0" },
  { title: "Business Analyst", desc: "Analyze customer data, optimize revenue planning, and lead data-informed growth.", icon: LineChart, color: "#FBBF24" },
];

const extendedRoles = [
  "SEO & SEM Executive",
  "Social Media Specialist",
  "Performance Marketing Strategist",
  "Digital Marketing Strategist",
  "Marketing Analyst",
  "AI Automation Specialist",
  "AI Product Associate",
  "Business Growth Executive",
  "Entrepreneurship Associate",
  "Digital Business Consultant",
];

const successHighlights = [
  "Alumni launching AI-driven startups & agencies globally",
  "Mentorship from top industry leaders & AI specialists",
  "Real-world projects powering career-ready portfolios",
  "Resume, LinkedIn, and mock interview support",
  "Business & entrepreneurial development guidance",
  "Access to active hiring partner & startup founder networks",
];

export default function OutcomesPage() {
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
          badge="Career & Business Outcomes"
          title="Real Skills. Real Portfolios. Verified Outcomes."
          subtitle="Supporting learners in securing entrepreneurial roles, starting businesses, and launching AI startups."
          description="WEAZ TECH state that over 90% of graduates secure entrepreneurial roles or launch startups within 12 months of completing their program."
        />

        {/* Detailed Career Outcomes section */}
        <CareerOutcomes />

        {/* Primary Pathways Detail */}
        <section className="py-20 md:py-28 relative border-t border-white/5 bg-[#0A0710]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-3xl mb-14">
              <div className="text-xs uppercase tracking-[0.25em] text-[#FBBF24] font-bold mb-3">
                Featured Pathways
              </div>
              <h2 className="font-display text-3xl md:text-5xl font-bold text-white">
                Core Career &amp; Founder Tracks
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {primaryPathways.map((path) => {
                const Icon = path.icon;
                return (
                  <div key={path.title} className="surface-card p-7 flex flex-col justify-between border-white/10">
                    <div>
                      <div
                        className="w-12 h-12 rounded-2xl grid place-items-center mb-6"
                        style={{
                          background: `${path.color}15`,
                          border: `1px solid ${path.color}35`,
                        }}
                      >
                        <Icon size={22} style={{ color: path.color }} />
                      </div>
                      <h3 className="font-display text-xl font-bold text-white mb-2">{path.title}</h3>
                      <p className="text-xs text-white/60 leading-relaxed">{path.desc}</p>
                    </div>

                    <button
                      onClick={() => openModal(path.title)}
                      className="mt-8 text-xs font-bold text-[#9B59D0] hover:text-[#FBBF24] inline-flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      Explore {path.title} <Rocket size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Extended Opportunities & Roles */}
        <section className="py-20 md:py-28 relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-3xl mb-14">
              <div className="text-xs uppercase tracking-[0.25em] text-[#9B59D0] font-bold mb-3">
                Job Roles &amp; Opportunities
              </div>
              <h2 className="font-display text-3xl md:text-5xl font-bold text-white">
                Related Career Roles
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {extendedRoles.map((role) => (
                <div key={role} className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex items-center gap-3">
                  <CheckCircle2 size={16} className="text-[#FBBF24] shrink-0" />
                  <span className="text-xs font-semibold text-white">{role}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Success Highlights & Verification Note */}
        <section className="py-20 md:py-28 relative border-t border-white/5 bg-[#0A0710]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="surface-card p-8 md:p-14 border-white/10">
              <div className="max-w-3xl mb-8">
                <div className="text-xs uppercase tracking-[0.25em] text-[#FBBF24] font-bold mb-3">
                  Key Highlights
                </div>
                <h3 className="font-display text-3xl font-bold text-white">
                  Why WEAZ TECH Alumni Succeed
                </h3>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {successHighlights.map((h) => (
                  <div key={h} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-3 text-sm text-white/80">
                    <ShieldCheck size={18} className="text-[#9B59D0] mt-0.5 shrink-0" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Alumni Testimonials Carousel */}
        <Testimonials />

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
