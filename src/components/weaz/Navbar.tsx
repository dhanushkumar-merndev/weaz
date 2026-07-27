"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ShineButton } from "@/components/ui/ShineButton";

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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "glass-nav shadow-lg shadow-black/20" : "bg-[#0F0B14]/80 backdrop-blur-md border-b border-white/5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          data-testid="nav-brand"
          className="font-display text-xl font-black tracking-tight text-white flex items-center gap-1 group"
        >
          <motion.span
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
            className="inline-flex items-center"
          >
            WEAZ<span className="text-[#9B59D0] group-hover:text-[#FBBF24] transition-colors">.</span>TECH
          </motion.span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                data-testid={`nav-link-${item.label.toLowerCase()}`}
                className={`relative text-sm font-medium transition-colors py-1 ${
                  isActive
                    ? "text-[#FBBF24] font-semibold"
                    : "text-white/70 hover:text-white"
                }`}
              >
                {item.label}
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FBBF24] rounded-full"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:block">
          <ShineButton
            data-testid="nav-enroll-btn"
            onClick={onEnroll}
            variant="gold"
            className="px-5 py-2 text-xs md:text-sm"
          >
            Enroll Now
          </ShineButton>
        </div>

        <button
          className="md:hidden text-white p-2 cursor-pointer focus:outline-none"
          data-testid="nav-mobile-toggle"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="md:hidden glass-nav border-t border-white/5 overflow-hidden"
            data-testid="nav-mobile-menu"
          >
            <div className="px-6 py-5 flex flex-col gap-3">
              {navItems.map((item, idx) => {
                const isActive = pathname === item.href;
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.25 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      data-testid={`nav-mobile-link-${item.label.toLowerCase()}`}
                      className={`block py-2 text-base ${
                        isActive ? "text-[#FBBF24] font-bold" : "text-white/80 hover:text-white"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                );
              })}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: navItems.length * 0.05, duration: 0.25 }}
                className="mt-2"
              >
                <ShineButton
                  data-testid="nav-mobile-enroll-btn"
                  onClick={() => {
                    setOpen(false);
                    onEnroll();
                  }}
                  variant="gold"
                  className="w-full text-center py-3"
                >
                  Enroll Now
                </ShineButton>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
