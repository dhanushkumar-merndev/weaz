"use client";

import React, { useState, useCallback, } from "react";
import Navbar from "@/components/weaz/Navbar";
import PageHeader from "@/components/weaz/PageHeader";
import Footer from "@/components/weaz/Footer";
import { EnrollmentModal } from "@/components/weaz/EnrollmentModal";
import WhatsAppFab from "@/components/weaz/WhatsAppFab";
import { GsapReveal } from "@/components/ui/GsapReveal";
import { Phone, Mail, Globe, MessageSquare, Send, Clock,} from "lucide-react";
import { toast } from "sonner";

const WHATSAPP_NUMBER = "919722933197";

const currentStatusOptions = [
  "Student / Fresh Graduate",
  "Working Professional",
  "Aspiring Entrepreneur",
  "Existing Business Owner",
];

const programOptions = [
  "Digital Journey Begins (6 Months - ₹35,000)",
  "One Step to Business (Flexible - ₹49,999)",
  "AI Hero (3 Months - ₹60,000)",
  "General Inquiry / Not Sure",
];

export default function ContactPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [defaultProgram, setDefaultProgram] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    status: "Student / Fresh Graduate",
    program: "Digital Journey Begins (6 Months - ₹35,000)",
    city: "",
    message: "",
  });

  const openModal = useCallback((program = "") => {
    setDefaultProgram(program);
    setModalOpen(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Please enter your full name.");
      return;
    }
    if (!form.phone.trim()) {
      toast.error("Please enter your WhatsApp number.");
      return;
    }

    const msgLines = [
      `*WEAZ TECH — Website Inquiry*`,
      `👤 *Name:* ${form.name.trim()}`,
      `📞 *WhatsApp:* ${form.phone.trim()}`,
      `✉️ *Email:* ${form.email.trim() || "N/A"}`,
      `🌆 *City:* ${form.city.trim() || "N/A"}`,
      `🎓 *Current Status:* ${form.status}`,
      `🎯 *Preferred Program:* ${form.program}`,
      `💬 *Learning Goal / Message:* ${form.message.trim() || "General Inquiry"}`,
    ];

    const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      msgLines.join("\n")
    )}`;

    window.open(waUrl, "_blank");
    toast.success("Opening WhatsApp with your pre-formatted application details!");
    setForm({
      name: "",
      phone: "",
      email: "",
      status: "Student / Fresh Graduate",
      program: "Digital Journey Begins (6 Months - ₹35,000)",
      city: "",
      message: "",
    });
  };

  return (
    <div className="relative min-h-screen bg-[#0F0B14] text-white overflow-x-hidden">
      <Navbar onEnroll={() => openModal("")} />

      <main className="relative z-10">
        <PageHeader
          badge="Admissions & Contact"
          title="Connect With WEAZ TECH"
          subtitle="Call or WhatsApp +91 97229 33197 for admissions & program guidance."
          description="Have questions about program curricula, fees, EMI plans, or batch timings? Fill in the form below or message our admissions desk directly on WhatsApp."
        />

        <section className="py-20 md:py-28 relative">
          <div className="max-w-7xl mx-auto px-6">
            <GsapReveal className="grid lg:grid-cols-12 gap-12 items-start" stagger={0.1}>
            {/* Contact Details Column */}
            <div className="lg:col-span-5 space-y-6">
              <div className="surface-card p-8 border-white/10 space-y-6">
                <h3 className="font-display text-2xl font-bold text-white">
                  Official Channels
                </h3>

                <div className="space-y-4">
                  <a
                    href="tel:+919722933197"
                    className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:border-[#9B59D0]/40 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#9B59D0]/15 border border-[#9B59D0]/30 grid place-items-center shrink-0">
                      <Phone size={18} className="text-[#9B59D0]" />
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider text-white/50 font-bold">
                        Phone &amp; WhatsApp
                      </div>
                      <div className="text-base font-semibold text-white mt-0.5">
                        +91 97229 33197
                      </div>
                    </div>
                  </a>

                  <a
                    href="mailto:hello@weaztech.com"
                    className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:border-[#FBBF24]/40 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#FBBF24]/15 border border-[#FBBF24]/30 grid place-items-center shrink-0">
                      <Mail size={18} className="text-[#FBBF24]" />
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider text-white/50 font-bold">
                        Primary Email
                      </div>
                      <div className="text-base font-semibold text-white mt-0.5">
                        hello@weaztech.com
                      </div>
                    </div>
                  </a>

                  <a
                    href="mailto:weaztechnology@gmail.com"
                    className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:border-[#9B59D0]/40 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#9B59D0]/15 border border-[#9B59D0]/30 grid place-items-center shrink-0">
                      <Mail size={18} className="text-[#9B59D0]" />
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider text-white/50 font-bold">
                        Brochure Desk Email
                      </div>
                      <div className="text-base font-semibold text-white mt-0.5">
                        weaztechnology@gmail.com
                      </div>
                    </div>
                  </a>

                  <a
                    href="https://www.weaztech.com"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:border-[#FBBF24]/40 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#FBBF24]/15 border border-[#FBBF24]/30 grid place-items-center shrink-0">
                      <Globe size={18} className="text-[#FBBF24]" />
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider text-white/50 font-bold">
                        Official Website
                      </div>
                      <div className="text-base font-semibold text-white mt-0.5">
                        www.weaztech.com
                      </div>
                    </div>
                  </a>

                  <a
                    href="https://instagram.com/weaztech"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:border-[#9B59D0]/40 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#9B59D0]/15 border border-[#9B59D0]/30 grid place-items-center shrink-0">
                      <svg
                        className="w-4 h-4 text-[#9B59D0]"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        viewBox="0 0 24 24"
                      >
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider text-white/50 font-bold">
                        Social Handle
                      </div>
                      <div className="text-base font-semibold text-white mt-0.5">
                        @weaztech
                      </div>
                    </div>
                  </a>
                </div>
              </div>

              {/* Office hours card */}
              <div className="surface-card p-8 border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <Clock size={20} className="text-[#FBBF24]" />
                  <h4 className="font-display text-lg font-bold text-white">Admissions Desk Hours</h4>
                </div>
                <p className="text-sm text-white/60 leading-relaxed">
                  Monday – Saturday: 9:00 AM – 7:00 PM IST<br />
                  Sunday: Closed (WhatsApp messages responded next business day)
                </p>
              </div>
            </div>

            {/* Form Column */}
            <div className="lg:col-span-7">
              <div className="surface-card p-8 md:p-12 border-white/10 relative">
                <div className="absolute -top-24 -right-24 w-56 h-56 rounded-full bg-[#9B59D0]/20 blur-[80px] pointer-events-none" />

                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FBBF24]/10 border border-[#FBBF24]/30 text-xs font-bold uppercase tracking-widest text-[#FBBF24] mb-3">
                    <MessageSquare size={13} /> Official Website Form
                  </div>
                  <h3 className="font-display text-3xl font-bold text-white">
                    Submit Inquiry via WhatsApp
                  </h3>
                  <p className="text-white/60 text-sm mt-2">
                    Submit your details below to automatically open WhatsApp with your pre-formatted application text to +91 97229 33197.
                  </p>

                  <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-white/60 mb-2 font-bold">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Aarav Sharma"
                        className="w-full h-11 px-4 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#9B59D0]"
                        required
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-white/60 mb-2 font-bold">
                          WhatsApp Number *
                        </label>
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          placeholder="+91 97229 33197"
                          className="w-full h-11 px-4 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#9B59D0]"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-white/60 mb-2 font-bold">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          placeholder="you@email.com"
                          className="w-full h-11 px-4 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-white/30 focus-visible:outline-none focus:border-[#9B59D0]"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-white/60 mb-2 font-bold">
                          Current Status *
                        </label>
                        <select
                          value={form.status}
                          onChange={(e) => setForm({ ...form, status: e.target.value })}
                          className="w-full h-11 px-4 rounded-xl bg-[#1A1525] border border-white/10 text-white focus:outline-none focus:border-[#9B59D0]"
                        >
                          {currentStatusOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs uppercase tracking-widest text-white/60 mb-2 font-bold">
                          City
                        </label>
                        <input
                          type="text"
                          value={form.city}
                          onChange={(e) => setForm({ ...form, city: e.target.value })}
                          placeholder="e.g. Pune, Mumbai, Delhi"
                          className="w-full h-11 px-4 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#9B59D0]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-widest text-white/60 mb-2 font-bold">
                        Preferred Program *
                      </label>
                      <select
                        value={form.program}
                        onChange={(e) => setForm({ ...form, program: e.target.value })}
                        className="w-full h-11 px-4 rounded-xl bg-[#1A1525] border border-white/10 text-white focus:outline-none focus:border-[#9B59D0]"
                      >
                        {programOptions.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-widest text-white/60 mb-2 font-bold">
                        Learning Goal / Additional Message
                      </label>
                      <textarea
                        rows={3}
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        placeholder="Tell us about your background, career goals, or any specific questions..."
                        className="w-full p-4 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#9B59D0] resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="pill-gold w-full py-4 text-base font-bold inline-flex items-center justify-center gap-2 cursor-pointer mt-4"
                    >
                      <Send size={18} /> Send Inquiry via WhatsApp
                    </button>
                  </form>
                </div>
              </div>
            </div>
            </GsapReveal>
          </div>
        </section>

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
