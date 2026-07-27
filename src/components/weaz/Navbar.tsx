"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut, User, CreditCard, Calendar, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ShineButton } from "@/components/ui/ShineButton";
import { useAuth } from "@/providers/AuthProvider";

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

interface EnrollmentInfo {
  status: string;
  paid_at: string | null;
  programs: { name: string; tagline: string; duration: string } | null;
}

const Navbar = ({ onEnroll }: NavbarProps) => {
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [enrollment, setEnrollment] = useState<EnrollmentInfo | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchProfile = useCallback(() => {
    if (!user) { setEnrollment(null); return; }
    fetch("/api/user/profile").then(r => r.json()).then(data => {
      if (data.enrollment) setEnrollment(data.enrollment);
    }).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetch("/api/admin/check").then(r => r.json()).then(data => {
        if (data.admin) setIsAdmin(true);
      }).catch(() => {});
    } else {
      setEnrollment(null);
      setIsAdmin(false);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    const handler = () => fetchProfile();
    window.addEventListener("enrollment-updated", handler);
    return () => window.removeEventListener("enrollment-updated", handler);
  }, [fetchProfile]);

  const handleEnrollClick = () => {
    onEnroll();
  };

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

        <div className="hidden md:flex items-center gap-3">
          <ShineButton
            data-testid="nav-enroll-btn"
            onClick={handleEnrollClick}
            variant="gold"
            className="px-5 py-2 text-xs md:text-sm"
            disabled={loading}
          >
            {loading ? "Loading..." : "Enroll Now"}
          </ShineButton>
          {user && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className="flex items-center gap-2 cursor-pointer focus:outline-none"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#9B59D0]/50 hover:border-[#FBBF24] transition-colors">
                  {user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#9B59D0] grid place-items-center">
                      <User size={14} className="text-white" />
                    </div>
                  )}
                </div>
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute -right-2 top-full mt-1.5 w-64 bg-[#15111D]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/40 z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-white/[0.06]">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-[#9B59D0]/30">
                          {user.user_metadata?.avatar_url ? (
                            <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-[#9B59D0] grid place-items-center">
                              <User size={14} className="text-white" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-display font-bold text-white text-sm truncate">
                            {user.user_metadata?.full_name || user.email?.split("@")[0] || "User"}
                          </div>
                          <div className="text-[11px] text-white/40 truncate">{user.email}</div>
                        </div>
                      </div>
                    </div>

                    {enrollment ? (
                      <div className="px-4 py-3 border-b border-white/[0.06]">
                        <div className="text-[10px] uppercase tracking-wider text-white/30 mb-2">Enrollment</div>
                        <div className="flex items-center gap-2 text-xs text-white/80 mb-1">
                          <CreditCard size={12} className="text-[#FBBF24]" />
                          <span className="truncate">{enrollment.programs?.name || "Enrolled"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/40">
                          <Calendar size={11} />
                          <span>
                            {enrollment.status === "paid"
                              ? `Paid ${enrollment.paid_at ? new Date(enrollment.paid_at).toLocaleDateString() : ""}`
                              : "Payment pending"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="px-4 py-4 border-b border-white/[0.06]">
                        <div className="text-[10px] uppercase tracking-wider text-white/30 mb-1.5">Enrollment</div>
                        <div className="text-xs text-white/40">No active enrollment</div>
                      </div>
                    )}

                    <div className="p-1.5 space-y-0.5">
                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/[0.06] rounded-xl transition-all cursor-pointer"
                        >
                          <Shield size={15} />
                          Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={() => { signOut(); setDropdownOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/[0.06] rounded-xl transition-all cursor-pointer"
                      >
                        <LogOut size={15} />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
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
              {user && (
                <div className="flex items-center gap-3 pb-3 border-b border-white/10 mb-1">
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-[#9B59D0]/50 shrink-0">
                    {user.user_metadata?.avatar_url ? (
                      <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#9B59D0] grid place-items-center">
                        <User size={14} className="text-white" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-white truncate">
                      {user.user_metadata?.full_name || user.email?.split("@")[0] || "User"}
                    </div>
                    <div className="text-xs text-white/50 truncate">{user.email}</div>
                  </div>
                </div>
              )}

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
                className="mt-2 flex flex-col gap-2"
              >
                <ShineButton
                  data-testid="nav-mobile-enroll-btn"
                  onClick={() => {
                    setOpen(false);
                    handleEnrollClick();
                  }}
                  variant="gold"
                  className="w-full text-center py-3"
                  disabled={loading}
                >
                  {loading ? "Loading..." : user ? "Enroll Now" : "Sign In to Enroll"}
                </ShineButton>
                {user && (
                  <button
                    onClick={() => { signOut(); setOpen(false); }}
                    className="w-full py-2.5 text-sm text-white/60 hover:text-white border border-white/10 rounded-full transition-colors cursor-pointer"
                  >
                    Sign Out
                  </button>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
