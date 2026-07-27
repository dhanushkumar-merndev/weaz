"use client";

import { useState, useCallback} from "react";
import Navbar from "@/components/weaz/Navbar";
import PageHeader from "@/components/weaz/PageHeader";
import ComparisonTable from "@/components/weaz/ComparisonTable";
import FinalCTA from "@/components/weaz/FinalCTA";
import Footer from "@/components/weaz/Footer";
import { EnrollmentModal } from "@/components/weaz/EnrollmentModal";
import WhatsAppFab from "@/components/weaz/WhatsAppFab";
import { GsapReveal } from "@/components/ui/GsapReveal";
import { CreditCard,CheckCircle2,ChevronDown} from "lucide-react";

const reasonsToChoose = [
  {
    title: "Practical, Industry-Relevant Curriculum",
    desc: "Combines digital marketing, business development, entrepreneurship, and AI rather than teaching these areas in isolation.",
  },
  {
    title: "Beginner-to-Advanced Learning Paths",
    desc: "Structured pathways tailored for freshers, business owners, and tech builders.",
  },
  {
    title: "Hands-On Projects & Case Studies",
    desc: "Work on practical assignments, real client briefs, business models, and working AI solutions.",
  },
  {
    title: "Mentorship & Guidance",
    desc: "Direct feedback and support from experienced business leaders, mentors, and AI specialists.",
  },
  {
    title: "Business-Focused AI Education",
    desc: "AI is taught through real business use cases: marketing, customer insights, automation, analytics, and product design.",
  },
  {
    title: "Career & Entrepreneurship Support",
    desc: "Dedicated assistance for employment, portfolio development, interview prep, business scaling, or startup creation.",
  },
  {
    title: "Access to Modern Tools & Tech",
    desc: "Hands-on exposure to digital marketing platforms, AI productivity tools, automation engines, and data analytics.",
  },
  {
    title: "Structured Program Options",
    desc: "Choose a course based on your current skill level, career goal, business requirement, or AI interest.",
  },
];

const faqs = [
  {
    q: "What is included in the published program fee?",
    a: "The fee stated for each program (₹35,000 for Digital Journey Begins, ₹49,999 for One Step to Business, ₹60,000 for AI Hero) is all-inclusive. It covers instructor-led training, 1:1 mentorship, live case studies, access to AI tools, software subscriptions, portfolio development, and career/placement support.",
  },
  {
    q: "Do you offer zero-cost EMI or installment payment plans?",
    a: "Yes! We provide zero-cost 3-month and 6-month EMI options through partner financial providers, allowing you to pay in easy monthly installments without extra interest.",
  },
  {
    q: "What are the details of the Job Guarantee for the Digital Journey Begins program?",
    a: "Our 6-month Digital Journey Begins program includes a published job guarantee benefit. Students complete modules, live project assignments, resume polish, and mock interviews, followed by placement matching with our partner network.",
  },
  {
    q: "Which program is best suited for my background?",
    a: "Digital Journey Begins (6 months) is designed for students, freshers, and beginners. One Step to Business (Flexible) is tailored for aspiring and established business owners wanting to scale. AI Hero (3 months) is built for tech learners and future AI leaders wanting intensive AI product & data skills.",
  },
  {
    q: "Can I switch programs after enrolling?",
    a: "Yes, within the first 14 days of your cohort start date, you can request a program track transfer by discussing with your assigned admissions counselor.",
  },
  {
    q: "What tools and software access are provided?",
    a: "Learners receive access to premium AI tool stacks, design platforms, SEO/SEM analytics tools, and automation sandbox environments required for project work.",
  },
];

export default function PricingPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [defaultProgram, setDefaultProgram] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const openModal = useCallback((program = "") => {
    setDefaultProgram(program);
    setModalOpen(true);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#0F0B14] text-white overflow-x-hidden">
      <Navbar onEnroll={() => openModal("")} />

      <main className="relative z-10">
        <PageHeader
          badge="Transparent Fees"
          title="Program Fees & Investment Options"
          subtitle="Simple, transparent program pricing with no hidden charges."
          description="Every WEAZ TECH program includes mentorship, hands-on projects, access to AI tools, and career or business support."
        />

        {/* Pricing Cards */}
        <ComparisonTable onEnroll={(p) => openModal(p)} />

        {/* Reasons to Choose WEAZ TECH */}
        <section className="py-20 md:py-28 relative border-t border-white/5 bg-[#0A0710]">
          <div className="max-w-7xl mx-auto px-6">
            <GsapReveal>
              <div className="max-w-3xl mb-14">
                <div className="text-xs uppercase tracking-[0.25em] text-[#FBBF24] font-bold mb-3">
                  The WEAZ Advantage
                </div>
                <h2 className="font-display text-3xl md:text-5xl font-bold text-white">
                  8 Reasons to Choose WEAZ TECH
                </h2>
              </div>
            </GsapReveal>

            <GsapReveal className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6" stagger={0.08}>
              {reasonsToChoose.map((r, idx) => (
                <div key={r.title} className="surface-card p-6 border-white/10 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-mono text-[#FBBF24] mb-3">0{idx + 1}</div>
                    <h4 className="font-display text-lg font-bold text-white mb-2">{r.title}</h4>
                    <p className="text-xs text-white/60 leading-relaxed">{r.desc}</p>
                  </div>
                </div>
              ))}
            </GsapReveal>
          </div>
        </section>

        {/* Financial Aid & EMI */}
        <section className="py-20 md:py-28 relative">
          <div className="max-w-7xl mx-auto px-6">
            <GsapReveal>
            <div className="surface-card p-8 md:p-14 border-white/10">
              <div className="grid lg:grid-cols-12 gap-10 items-center">
                <div className="lg:col-span-7">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FBBF24]/10 border border-[#FBBF24]/30 text-xs font-bold uppercase tracking-widest text-[#FBBF24] mb-4">
                    <CreditCard size={14} /> Flexible Payment Options
                  </div>
                  <h3 className="font-display text-3xl md:text-4xl font-bold text-white">
                    0% Interest EMI &amp; Early Bird Scholarships
                  </h3>
                  <p className="mt-4 text-white/70 leading-relaxed text-sm">
                    We believe financial constraints should never hold back determined learners. Pay in easy 3 or 6 month installments with zero extra interest, or speak to our admissions team regarding early-bird scholarship grants.
                  </p>

                  <div className="mt-6 grid sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                      <CheckCircle2 size={18} className="text-[#22c55e] shrink-0" />
                      <span className="text-sm font-semibold text-white">0% Interest Monthly Installments</span>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                      <CheckCircle2 size={18} className="text-[#22c55e] shrink-0" />
                      <span className="text-sm font-semibold text-white">Early Bird &amp; Merit Scholarships</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 text-center lg:text-right">
                  <button
                    onClick={() => openModal("EMI & Scholarship Query")}
                    className="pill-gold px-8 py-4 text-base font-bold inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Inquire About EMI / Scholarship
                  </button>
                  <div className="text-xs text-white/40 mt-3">
                    Fast approval process via WhatsApp (+91 97229 33197)
                  </div>
                </div>
              </div>
            </div>
            </GsapReveal>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-20 md:py-28 relative border-t border-white/5 bg-[#0A0710]">
          <div className="max-w-4xl mx-auto px-6">
            <GsapReveal>
              <div className="text-center mb-16">
                <div className="text-xs uppercase tracking-[0.25em] text-[#9B59D0] font-bold mb-3">
                  Got Questions?
                </div>
                <h2 className="font-display text-4xl md:text-5xl font-black text-white">
                  Frequently Asked Questions
                </h2>
              </div>
            </GsapReveal>

            <GsapReveal className="space-y-4" stagger={0.08}>
              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={faq.q}
                    className="surface-card border-white/10 overflow-hidden"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full p-6 text-left flex items-center justify-between gap-4 cursor-pointer"
                    >
                      <span className="font-display text-lg font-bold text-white">
                        {faq.q}
                      </span>
                      <ChevronDown
                        size={20}
                        className={`text-white/60 transition-transform duration-300 ${
                          isOpen ? "rotate-180 text-[#FBBF24]" : ""
                        }`}
                      />
                    </button>

                    {isOpen ? (
                      <div className="px-6 pb-6 text-sm text-white/70 leading-relaxed border-t border-white/5 pt-4">
                        {faq.a}
                      </div>
                    ) : null}
                  </div>
                );
              })}
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
