"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

interface NavbarProps {
  onEnroll: () => void;
}

const navItems = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/programs", label: "Programs" },
  { href: "/pricing", label: "Pricing" },
  { href: "/outcomes", label: "Outcomes" },
  { href: "/contact", label: "Contact" },
];

const Navbar = ({ onEnroll }: NavbarProps) => {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-testid="site-navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-all ${
        scrolled ? "glass-nav" : "bg-[#0F0B14]/80 backdrop-blur-md border-b border-white/5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          data-testid="nav-brand"
          className="font-display text-xl font-black tracking-tight text-white flex items-center gap-1"
        >
          WEAZ<span className="text-[#9B59D0]">.</span>TECH
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                data-testid={`nav-link-${item.label.toLowerCase()}`}
                className={`text-sm font-medium transition-colors ${
                  isActive
                    ? "text-[#FBBF24] font-semibold"
                    : "text-white/70 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:block">
          <button
            data-testid="nav-enroll-btn"
            onClick={onEnroll}
            className="pill-gold px-5 py-2.5 text-sm cursor-pointer"
          >
            Enroll Now
          </button>
        </div>

        <button
          className="md:hidden text-white p-2 cursor-pointer"
          data-testid="nav-mobile-toggle"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div
          className="md:hidden glass-nav border-t border-white/5"
          data-testid="nav-mobile-menu"
        >
          <div className="px-6 py-4 flex flex-col gap-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  data-testid={`nav-mobile-link-${item.label.toLowerCase()}`}
                  className={`py-2 text-base ${
                    isActive ? "text-[#FBBF24] font-bold" : "text-white/80"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <button
              data-testid="nav-mobile-enroll-btn"
              onClick={() => {
                setOpen(false);
                onEnroll();
              }}
              className="pill-gold px-5 py-2.5 text-sm mt-2 self-start cursor-pointer"
            >
              Enroll Now
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
