"use client";

import React, { useState } from "react";
import { Quote, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FadeIn } from "@/components/ui/FadeIn";

const testimonials = [
  {
    name: "Aarav Sharma",
    role: "Founder, LumenAI Studio",
    program: "AI Hero",
    quote:
      "The AI Hero capstone forced me to ship. I turned my final project into a real SaaS that now serves 300+ SMBs across Pune.",
  },
  {
    name: "Priya Iyer",
    role: "Growth Lead, ShopLocal",
    program: "Professional Business Owner",
    quote:
      "I stopped guessing my marketing. The performance marketing lab paid for itself in the first month of applying what I learned.",
  },
  {
    name: "Rohan Deshmukh",
    role: "Digital Marketing Analyst",
    program: "Beginner Program",
    quote:
      "I came in with zero background. Six months later I'm running paid campaigns for a D2C brand — WEAZ genuinely changed my trajectory.",
  },
  {
    name: "Sanya Kapoor",
    role: "AI Consultant, Bengaluru",
    program: "AI Hero",
    quote:
      "The mentors don't just teach — they push you. Every project felt like a real client brief. That's what got me hired.",
  },
];

const Testimonials = () => {
  const [i, setI] = useState(0);
  const t = testimonials[i];

  return (
    <section data-testid="testimonials-section" className="relative py-24 md:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <FadeIn direction="up">
          <div className="grid lg:grid-cols-12 gap-10 items-end">
            <div className="lg:col-span-6">
              <div className="text-xs uppercase tracking-[0.25em] text-[#9B59D0] font-bold mb-4">
                Alumni Voices
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-white">
                Real people.
                <br />
                <span className="text-white/60">Real outcomes.</span>
              </h2>
            </div>
            <div className="lg:col-span-6 text-white/50 text-sm">
              Sample stories from our growing community — edit these once your first cohort graduates.
            </div>
          </div>
        </FadeIn>

        <FadeIn direction="up" delay={0.15}>
          <div className="mt-14 surface-card p-8 md:p-14 relative overflow-hidden min-h-[320px] flex flex-col justify-between">
            <Quote size={80} className="absolute -top-6 -right-4 text-[#9B59D0]/10 pointer-events-none" />
            <div className="flex gap-1 mb-8">
              {[...Array(5)].map((_, k) => (
                <Star key={k} size={14} className="text-[#FBBF24]" fill="#FBBF24" />
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="flex-1"
              >
                <blockquote
                  data-testid="testimonial-quote"
                  className="font-display text-2xl md:text-3xl lg:text-4xl leading-snug font-medium max-w-4xl text-white"
                >
                  &ldquo;{t.quote}&rdquo;
                </blockquote>

                <div className="mt-10 flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <div className="font-semibold text-lg text-white">{t.name}</div>
                    <div className="text-sm text-white/50">
                      {t.role} · <span className="text-[#9B59D0] font-medium">{t.program}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-end gap-3">
              <button
                data-testid="testimonial-prev"
                onClick={() => setI((i - 1 + testimonials.length) % testimonials.length)}
                className="w-11 h-11 rounded-full border border-white/10 grid place-items-center hover:border-[#FBBF24] hover:text-[#FBBF24] transition-all text-white cursor-pointer"
                aria-label="Previous testimonial"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                data-testid="testimonial-next"
                onClick={() => setI((i + 1) % testimonials.length)}
                className="w-11 h-11 rounded-full border border-white/10 grid place-items-center hover:border-[#FBBF24] hover:text-[#FBBF24] transition-all text-white cursor-pointer"
                aria-label="Next testimonial"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </FadeIn>

        <div className="mt-6 flex gap-2 justify-center">
          {testimonials.map((_, k) => (
            <button
              key={k}
              onClick={() => setI(k)}
              data-testid={`testimonial-dot-${k}`}
              aria-label={`Testimonial ${k + 1}`}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                k === i ? "w-8 bg-[#FBBF24]" : "w-1.5 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
