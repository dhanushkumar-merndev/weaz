"use client";

import React from "react";
import { Phone, Mail, Globe, MapPin } from "lucide-react";
import Link from "next/link";
import { WEAZ_ADDRESS_TEXT, WEAZ_MAP_URL } from "@/lib/site-details";

const Footer = () => {
  return (
    <footer
      id="contact"
      data-testid="site-footer"
      className="relative pt-24 md:pt-32 pb-10 bg-[#0A0710] border-t border-white/5 mt-16"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-6">
            <div className="text-xs uppercase tracking-[0.25em] text-[#9B59D0] font-bold mb-4">
              Let&apos;s Connect
            </div>
            <h3 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-white">
              Ready to start your journey?
            </h3>
            <p className="mt-4 text-white/60 max-w-md">
              Reach out to us for personalized guidance and enrollment support. Our team will
              respond within 24 hours.
            </p>
          </div>

          <div className="lg:col-span-6 grid sm:grid-cols-2 gap-4">
            <a
              href="tel:+919742933197"
              data-testid="footer-phone-link"
              className="p-5 rounded-2xl border border-white/10 hover:border-[#9B59D0]/50 transition-colors flex items-start gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-[#9B59D0]/15 border border-[#9B59D0]/30 grid place-items-center shrink-0">
                <Phone size={16} className="text-[#9B59D0]" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.25em] text-white/50 font-bold">
                  Phone
                </div>
                <div className="mt-1 font-semibold text-white">+91 97429 33197</div>
              </div>
            </a>

            <a
              href="mailto:hello@weaztech.com"
              data-testid="footer-email-link"
              className="p-5 rounded-2xl border border-white/10 hover:border-[#9B59D0]/50 transition-colors flex items-start gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-[#FBBF24]/15 border border-[#FBBF24]/30 grid place-items-center shrink-0">
                <Mail size={16} className="text-[#FBBF24]" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.25em] text-white/50 font-bold">
                  Email
                </div>
                <div className="mt-1 font-semibold text-white">hello@weaztech.com</div>
              </div>
            </a>

            <a
              href="https://www.weaztech.com"
              target="_blank"
              rel="noreferrer"
              data-testid="footer-web-link"
              className="p-5 rounded-2xl border border-white/10 hover:border-[#9B59D0]/50 transition-colors flex items-start gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-[#9B59D0]/15 border border-[#9B59D0]/30 grid place-items-center shrink-0">
                <Globe size={16} className="text-[#9B59D0]" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.25em] text-white/50 font-bold">
                  Web
                </div>
                <div className="mt-1 font-semibold text-white">www.weaztech.com</div>
              </div>
            </a>

            <a
              href="https://instagram.com/weaztech"
              target="_blank"
              rel="noreferrer"
              data-testid="footer-social-link"
              className="p-5 rounded-2xl border border-white/10 hover:border-[#9B59D0]/50 transition-colors flex items-start gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-[#FBBF24]/15 border border-[#FBBF24]/30 grid place-items-center shrink-0">
                <svg
                  className="w-4 h-4 text-[#FBBF24]"
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
                <div className="text-xs uppercase tracking-[0.25em] text-white/50 font-bold">
                  Social
                </div>
                <div className="mt-1 font-semibold text-white">@weaztech</div>
              </div>
            </a>

            <a
              href={WEAZ_MAP_URL}
              target="_blank"
              rel="noreferrer"
              data-testid="footer-address-link"
              className="p-5 rounded-2xl border border-white/10 hover:border-[#9B59D0]/50 transition-colors flex items-start gap-3 sm:col-span-2"
            >
              <div className="w-10 h-10 rounded-xl bg-[#9B59D0]/15 border border-[#9B59D0]/30 grid place-items-center shrink-0">
                <MapPin size={17} className="text-[#9B59D0]" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.25em] text-white/50 font-bold">
                  Office Address
                </div>
                <address className="mt-1 font-semibold leading-relaxed text-white not-italic">
                  {WEAZ_ADDRESS_TEXT}
                </address>
                <div className="mt-2 text-xs font-bold text-[#FBBF24]">
                  Open in Google Maps
                </div>
              </div>
            </a>
          </div>
        </div>

        {/* Big brand watermark */}
        <div className="mt-20 relative select-none">
          <div className="font-display text-[22vw] md:text-[18vw] lg:text-[15vw] leading-none font-black tracking-tighter bg-gradient-to-b from-white/10 to-transparent bg-clip-text text-transparent text-center">
            WEAZ TECH
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
          <div>© {new Date().getFullYear()} WEAZ Tech. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <Link href="/blog" className="transition hover:text-white">
              Blog
            </Link>
            <span>Learn. Build. Grow. Lead with AI.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
