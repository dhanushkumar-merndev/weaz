"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";

interface PageHeaderProps {
  badge: string;
  title: string;
  subtitle: string;
  description?: string;
}

const PageHeader = ({ badge, title, subtitle, description }: PageHeaderProps) => {
  return (
    <div className="relative pt-32 pb-16 md:pt-40 md:pb-20 border-b border-white/5 overflow-hidden">
      <div className="blob blob-purple" style={{ width: 450, height: 450, top: -150, left: -100 }} />
      <div className="blob blob-gold" style={{ width: 350, height: 350, top: 50, right: -100 }} />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <FadeIn direction="up">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-white/50 mb-6">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight size={12} />
            <span className="text-[#FBBF24] font-medium">{title}</span>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#9B59D0]/30 bg-[#9B59D0]/10 text-xs uppercase tracking-[0.2em] text-[#9B59D0] font-bold mb-6">
            {badge}
          </div>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-none">
            {title} <span className="block text-white/60 text-2xl sm:text-3xl md:text-4xl mt-3 font-semibold">{subtitle}</span>
          </h1>

          {description ? (
            <p className="mt-6 text-white/70 text-lg md:text-xl max-w-3xl leading-relaxed">
              {description}
            </p>
          ) : null}
        </FadeIn>
      </div>
    </div>
  );
};

export default PageHeader;
