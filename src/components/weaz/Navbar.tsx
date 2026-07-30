"use client";

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
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
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

interface EnrollmentInfo {
  status: string;
  paid_at: string | null;
  programs: { name: string; tagline: string; duration: string } | null;
}

interface ProfileResult {
  userId: string;
  enrollment: EnrollmentInfo | null;
}

interface AdminResult {
  userId: string;
  isAdmin: boolean;
}

const Navbar = ({ onEnroll }: NavbarProps) => {
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileResult, setProfileResult] = useState<ProfileResult | null>(null);
  const [adminResult, setAdminResult] = useState<AdminResult | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const desktopNavRef = useRef<HTMLElement>(null);
  const desktopLinkRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0, ready: false });
  const [indicatorMotion, setIndicatorMotion] = useState(false);
  const enrollment =
    user && profileResult?.userId === user.id
      ? profileResult.enrollment
      : null;
  const isAdmin = Boolean(
    user &&
      adminResult?.userId === user.id &&
      adminResult.isAdmin
  );

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

  useEffect(() => {
    if (!open) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [open]);

  const fetchProfile = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch("/api/user/profile");
      if (!response.ok) return;
      const data = await response.json();
      setProfileResult({
        userId: user.id,
        enrollment: data.enrollment ?? null,
      });
    } catch {
      // Keep the navigation usable if profile loading fails.
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    const userId = user.id;

    fetch("/api/user/profile")
      .then((response) => {
        if (!response.ok) return null;
        return response.json();
      })
      .then((data) => {
        if (!cancelled && data) {
          setProfileResult({
            userId,
            enrollment: data.enrollment ?? null,
          });
        }
      })
      .catch(() => {
        // Keep the navigation usable if profile loading fails.
      });

    async function fetchAdminStatus() {
      try {
        const response = await fetch("/api/admin/check");
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled) {
          setAdminResult({
            userId,
            isAdmin: data.admin === true,
          });
        }
      } catch {
        // A failed admin check should not affect the public navigation.
      }
    }

    void fetchAdminStatus();
    return () => {
      cancelled = true;
    };
  }, [user, fetchProfile]);

  useEffect(() => {
    const handler = () => fetchProfile();
    window.addEventListener("enrollment-updated", handler);
    return () => window.removeEventListener("enrollment-updated", handler);
  }, [fetchProfile]);

  const handleEnrollClick = () => {
    onEnroll();
  };

  const handleRouteChange = (targetHref: string) => {
    const currentHref =
      navItems.find((item) =>
        item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
      )?.href ?? "/";

    sessionStorage.setItem(
      "weaz-nav-transition",
      JSON.stringify({ from: currentHref, to: targetHref, at: Date.now() })
    );
    window.dispatchEvent(new Event("weaz-route-start"));
  };

  useLayoutEffect(() => {
    const activeIndex = navItems.findIndex((item) =>
      item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
    );
    const activeLink = desktopLinkRefs.current[activeIndex];
    if (!activeLink) return;

    const target = {
      left: activeLink.offsetLeft,
      width: activeLink.offsetWidth,
      ready: true,
    };
    let navTransition: { from: string; to: string; at: number } | null = null;
    try {
      navTransition = JSON.parse(
        sessionStorage.getItem("weaz-nav-transition") ?? "null"
      );
    } catch {
      navTransition = null;
    }
    const hasFreshTransition =
      navTransition?.to === navItems[activeIndex].href &&
      Date.now() - navTransition.at < 5_000;
    const previousIndex = hasFreshTransition
      ? navItems.findIndex((item) => item.href === navTransition?.from)
      : -1;
    const previousLink = desktopLinkRefs.current[previousIndex];
    let frame = 0;

    if (previousLink && previousIndex !== activeIndex) {
      setIndicatorMotion(false);
      setIndicator({
        left: previousLink.offsetLeft,
        width: previousLink.offsetWidth,
        ready: true,
      });
      frame = window.requestAnimationFrame(() => {
        setIndicatorMotion(true);
        setIndicator(target);
      });
    } else {
      setIndicatorMotion(false);
      setIndicator(target);
    }

    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  return (
    <header
      data-testid="site-navbar"
      style={{ top: "var(--webinar-announcement-height, 0px)" }}
      className={`fixed left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "glass-nav shadow-lg shadow-black/20" : "bg-[#0F0B14]/80 backdrop-blur-md border-b border-white/5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          onClick={() => handleRouteChange("/")}
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

        <nav ref={desktopNavRef} className="relative hidden md:flex items-center gap-8">
          {navItems.map((item, index) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                ref={(node) => {
                  desktopLinkRefs.current[index] = node;
                }}
                href={item.href}
                onClick={() => handleRouteChange(item.href)}
                data-testid={`nav-link-${item.label.toLowerCase()}`}
                className={`relative text-sm font-medium transition-colors py-1 ${
                  isActive
                    ? "text-[#FBBF24] font-semibold"
                    : "text-white/70 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 h-0.5 rounded-full bg-[#FBBF24] shadow-[0_0_8px_rgba(251,191,36,0.45)]"
            initial={false}
            animate={{
              x: indicator.left,
              width: indicator.width,
              opacity: indicator.ready ? 1 : 0,
            }}
            transition={
              indicatorMotion
                ? { duration: 0.42, ease: [0.22, 1, 0.36, 1] }
                : { duration: 0 }
            }
          />
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <ShineButton
            data-testid="nav-enroll-btn"
            onClick={handleEnrollClick}
            variant="gold"
            className="!px-4 !py-2 !text-xs"
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
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            style={{
              height:
                "calc(100dvh - var(--webinar-announcement-height, 0px) - 4rem)",
            }}
            className="absolute inset-x-0 top-full overflow-y-auto overscroll-contain border-t border-white/5 bg-[#100b18]/96 backdrop-blur-2xl md:hidden"
            data-testid="nav-mobile-menu"
            data-lenis-prevent
          >
            <div className="flex min-h-full flex-col gap-3 px-6 py-6">
              {user && (
                <div className="pb-4 border-b border-white/10 mb-1">
                  <div className="flex items-center gap-3">
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
                    <span className="ml-auto shrink-0 rounded-full border border-[#9B59D0]/30 bg-[#9B59D0]/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#c994f0]">
                      {isAdmin ? "Admin" : "Student"}
                    </span>
                  </div>

                  <div className="mt-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
                    <div className="text-[10px] uppercase tracking-wider text-white/30">
                      Active enrollment
                    </div>
                    {enrollment ? (
                      <div className="mt-2">
                        <div className="flex items-center gap-2 text-sm text-white/85">
                          <CreditCard size={13} className="shrink-0 text-[#FBBF24]" />
                          <span className="truncate">{enrollment.programs?.name || "Enrolled"}</span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-2 text-xs text-white/45">
                          <Calendar size={12} />
                          <span>
                            {enrollment.status === "paid"
                              ? `Active${enrollment.programs?.duration ? ` · ${enrollment.programs.duration}` : ""}`
                              : "Payment pending"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-1.5 text-xs text-white/45">No active enrollment</div>
                    )}
                  </div>
                </div>
              )}

              {user && isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  data-testid="nav-mobile-admin-link"
                  className="flex items-center gap-2.5 rounded-xl border border-[#FBBF24]/20 bg-[#FBBF24]/5 px-3 py-2.5 text-sm font-semibold text-[#FBBF24]"
                >
                  <Shield size={15} />
                  Admin Panel
                </Link>
              )}

              {navItems.map((item, idx) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.25 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => {
                        handleRouteChange(item.href);
                        setOpen(false);
                      }}
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
                  className="w-full text-center !py-2.5 !text-sm"
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
