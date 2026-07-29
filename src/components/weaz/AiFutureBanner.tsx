"use client";
/* The background is a local static texture. */
/* eslint-disable @next/next/no-img-element */

import { ArrowRight, Sparkles } from "lucide-react";
import { motion, type Variants } from "framer-motion";
import { ShineButton } from "@/components/ui/ShineButton";
import { useActiveWebinar } from "@/hooks/useActiveWebinar";

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 25 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] },
  },
};

export function AiFutureBanner() {
  const { data: activeWebinar = null } = useActiveWebinar();

  return (
    <section
      data-testid="ai-future-section"
      className="relative isolate overflow-hidden border-y border-white/[0.06] py-24 sm:py-28 md:py-36"
    >
      <div className="absolute inset-0 -z-20">
        <img
          src="/images/purple-texture.jpg"
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover opacity-25"
        />
      </div>
      <div className="absolute inset-0 -z-10 bg-[#0F0B14]/75" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(circle_at_center,black,transparent_78%)]" />
      <div className="absolute left-1/2 top-1/2 -z-10 h-[520px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#9B59D0]/10 blur-[110px]" />

      <motion.div
        className="mx-auto max-w-7xl px-5 text-center sm:px-6"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        transition={{ staggerChildren: 0.12 }}
      >
        <motion.div
          variants={itemVariants}
          className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70 backdrop-blur-md"
        >
          <Sparkles size={14} className="text-[#FBBF24]" />
          Your AI future starts now
        </motion.div>

        <motion.h2
          variants={itemVariants}
          className="font-display mx-auto max-w-6xl text-[clamp(2.8rem,7vw,6.7rem)] font-black leading-[0.96] tracking-[-0.055em]"
        >
          <span className="block text-white">AI Is Replacing Jobs.</span>
          <span className="mt-3 block text-white/55">
            It&apos;s Also Creating
          </span>
          <span className="block text-white/55">Millionaires.</span>
          <span className="mt-5 block text-[#FBBF24]">
            Which One Are You Becoming?
          </span>
        </motion.h2>

        <motion.p
          variants={itemVariants}
          className="mx-auto mt-8 max-w-3xl text-base leading-relaxed text-white/65 sm:text-xl md:text-2xl"
        >
          Learn. Build. Grow. Lead with AI — real skills, real mentors, real
          outcomes, in 3–6 months.
        </motion.p>

        {activeWebinar && (
          <motion.div variants={itemVariants} className="mt-9">
            <ShineButton
              data-testid="ai-future-webinar-btn"
              onClick={() =>
                window.dispatchEvent(new CustomEvent("weaz-open-webinar"))
              }
              variant="gold"
              className="px-8 py-4 text-base sm:px-10"
            >
              Register for {activeWebinar.title}
              <ArrowRight size={18} />
            </ShineButton>
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}
