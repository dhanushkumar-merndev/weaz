"use client";
/* Supabase serves an already resized WebP from a dynamic public bucket URL. */
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Loader2,
  MessageCircle,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShineButton } from "@/components/ui/ShineButton";
import { useAuth } from "@/providers/AuthProvider";
import {
  loadRazorpayScript,
  type RazorpayOptions,
  type RazorpaySuccessResponse,
} from "@/lib/razorpay-checkout";
import { formatIndiaDateTime } from "@/lib/india-time";
import { useActiveWebinar } from "@/hooks/useActiveWebinar";

type ModalView = "promo" | "form" | "access" | "success" | null;

function formatPrice(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export function WebinarExperience() {
  const pathname = usePathname();
  const { user, signInWithGoogle } = useAuth();
  const startedAt = useRef<number | null>(null);
  const promoHandled = useRef(false);
  const barRef = useRef<HTMLDivElement>(null);
  const [barVisible, setBarVisible] = useState(true);
  const [view, setView] = useState<ModalView>(null);
  const [enrollmentModalOpen, setEnrollmentModalOpen] = useState(
    () =>
      typeof document !== "undefined" &&
      document.body.dataset.enrollmentModalOpen === "true"
  );
  const [submitting, setSubmitting] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(false);
  const [whatsAppGroupUrl, setWhatsAppGroupUrl] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "" });
  const excluded = pathname.startsWith("/admin") || pathname.startsWith("/auth");
  const { data: webinar = null } = useActiveWebinar(!excluded);

  useEffect(() => {
    if (excluded) return;
    startedAt.current ??= Date.now();
  }, [excluded]);

  useEffect(() => {
    const handleEnrollmentModalChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ open?: boolean }>;
      setEnrollmentModalOpen(customEvent.detail?.open === true);
    };

    window.addEventListener(
      "weaz-enrollment-modal-change",
      handleEnrollmentModalChange
    );
    return () =>
      window.removeEventListener(
        "weaz-enrollment-modal-change",
        handleEnrollmentModalChange
      );
  }, []);

  useEffect(() => {
    if (!webinar) return;
    if (promoHandled.current) return;
    if (enrollmentModalOpen || view !== null) return;

    const elapsed = Date.now() - (startedAt.current ?? Date.now());
    const timer = window.setTimeout(() => {
      if (
        view === null &&
        !enrollmentModalOpen &&
        !promoHandled.current
      ) {
        promoHandled.current = true;
        setView("promo");
      }
    }, Math.max(0, 10_000 - elapsed));
    return () => window.clearTimeout(timer);
  }, [enrollmentModalOpen, webinar, view]);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    if (!webinar || !barVisible || excluded || view !== null) {
      root.style.setProperty("--webinar-announcement-height", "0px");
      body.classList.remove("has-webinar-announcement");
      return;
    }

    body.classList.add("has-webinar-announcement");
    const updateHeight = () => {
      const height = barRef.current?.getBoundingClientRect().height ?? 0;
      root.style.setProperty("--webinar-announcement-height", `${height}px`);
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    if (barRef.current) observer.observe(barRef.current);
    return () => {
      observer.disconnect();
      root.style.setProperty("--webinar-announcement-height", "0px");
      body.classList.remove("has-webinar-announcement");
    };
  }, [barVisible, excluded, view, webinar]);

  const checkPurchasedAccess = useCallback(async () => {
    if (!user || !webinar) return false;
    try {
      const response = await fetch(
        `/api/webinars/access?webinar_id=${encodeURIComponent(webinar.id)}`,
        { cache: "no-store" }
      );
      const result = await response.json();
      if (response.ok && result.purchased) {
        setWhatsAppGroupUrl(result.whatsapp_group_url ?? null);
        return true;
      }
    } catch {
      // Keep registration available if the access check temporarily fails.
    }
    return false;
  }, [user, webinar]);

  const openForm = useCallback(async () => {
    if (!webinar) return;
    promoHandled.current = true;
    setForm((current) => ({
      ...current,
      name:
        current.name ||
        user?.user_metadata?.full_name ||
        user?.email?.split("@")[0] ||
        "",
    }));
    setView("form");
    void loadRazorpayScript();
    if (user) {
      setCheckingAccess(true);
      const purchased = await checkPurchasedAccess();
      setCheckingAccess(false);
      if (purchased) setView("access");
    }
  }, [checkPurchasedAccess, user, webinar]);

  useEffect(() => {
    const handleOpenRequest = () => {
      void openForm();
    };
    window.addEventListener("weaz-open-webinar", handleOpenRequest);
    return () =>
      window.removeEventListener("weaz-open-webinar", handleOpenRequest);
  }, [openForm]);

  const closeModal = (open: boolean) => {
    if (!open && !submitting) setView(null);
  };

  const handlePay = async () => {
    if (!webinar || !user?.email) return;
    const digits = form.phone.replace(/\D/g, "");
    const normalized =
      digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
    if (form.name.trim().length < 2 || normalized.length !== 10) {
      toast.error("Enter your name and a valid 10-digit phone number");
      return;
    }

    setSubmitting(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded || !window.Razorpay) {
        throw new Error("Secure checkout could not load. Please try again.");
      }

      const registrationResponse = await fetch("/api/webinars/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webinar_id: webinar.id,
          name: form.name.trim(),
          phone: normalized,
        }),
      });
      const registrationResult = await registrationResponse.json();
      if (!registrationResponse.ok) {
        if (
          registrationResponse.status === 409 &&
          (await checkPurchasedAccess())
        ) {
          setSubmitting(false);
          setView("access");
          return;
        }
        throw new Error(registrationResult.error || "Could not register");
      }

      const orderResponse = await fetch("/api/webinars/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registration_id: registrationResult.registration.id,
        }),
      });
      const order = await orderResponse.json();
      if (!orderResponse.ok) {
        throw new Error(order.error || "Could not create payment");
      }

      const options: RazorpayOptions = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "WEAZ TECH",
        description: webinar.title,
        order_id: order.order_id,
        prefill: {
          name: form.name.trim(),
          email: user.email,
          contact: normalized,
        },
        theme: { color: "#9B59D0" },
        modal: {
          ondismiss: () => setSubmitting(false),
        },
        handler: async (result: RazorpaySuccessResponse) => {
          const verifyResponse = await fetch("/api/webinars/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(result),
          });
          const verification = await verifyResponse.json();
          if (verifyResponse.status === 202) {
            toast.info("Payment received and awaiting final confirmation");
            setSubmitting(false);
            return;
          }
          if (!verifyResponse.ok || !verification.success) {
            toast.error(verification.error || "Payment verification failed");
            setSubmitting(false);
            return;
          }
          await checkPurchasedAccess();
          setSubmitting(false);
          setView("success");
        },
      };

      const checkout = new window.Razorpay(options);
      checkout.on("payment.failed", (result) => {
        toast.error(result.error?.description || "Payment failed");
        setSubmitting(false);
      });
      checkout.open();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
      setSubmitting(false);
    }
  };

  if (!webinar || excluded) return null;

  return (
    <>
      {barVisible && view === null && (
        <div
          ref={barRef}
          className="fixed inset-x-0 top-0 z-[60] border-b border-[#FBBF24]/20 bg-[#17121f]/95 px-10 py-2 text-center shadow-lg shadow-black/20 backdrop-blur-xl"
          data-testid="webinar-announcement"
        >
          <button
            type="button"
            onClick={openForm}
            className="inline-flex cursor-pointer items-center justify-center gap-2 text-xs font-semibold text-white sm:text-sm"
          >
            <Sparkles size={14} className="shrink-0 text-[#FBBF24]" />
            <span>{webinar.announcement_text}</span>
            <span className="hidden text-[#FBBF24] underline underline-offset-4 sm:inline">
              Register now
            </span>
          </button>
          <button
            type="button"
            onClick={() => setBarVisible(false)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white"
            aria-label="Dismiss webinar announcement"
          >
            <X size={15} />
          </button>
        </div>
      )}

      <Dialog
        open={view !== null}
        onOpenChange={closeModal}
        modal={!submitting}
      >
        <DialogContent
          data-lenis-prevent
          className={`!left-2 !top-2 !right-2 !bottom-2 !block !h-[calc(100dvh_-_1rem)] !max-h-none !w-auto !max-w-none !translate-x-0 !translate-y-0 touch-pan-y overflow-x-hidden overflow-y-scroll overscroll-contain rounded-2xl border border-white/10 bg-[#171021] p-0 text-white shadow-2xl shadow-[#9B59D0]/10 [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden [&>button]:sticky [&>button]:top-3 [&>button]:z-20 [&>button]:ml-auto [&>button]:mr-3 [&>button]:-mb-10 [&>button]:grid [&>button]:h-10 [&>button]:w-10 [&>button]:place-items-center [&>button]:rounded-full [&>button]:bg-black/45 [&>button]:text-white [&>button]:opacity-100 [&>button]:backdrop-blur-md [&>button]:focus:ring-0 [&>button]:focus:ring-offset-0 [&>button]:focus-visible:ring-2 [&>button]:focus-visible:ring-white/30 sm:!left-1/2 sm:!top-1/2 sm:!right-auto sm:!bottom-auto sm:!grid sm:!h-auto sm:!max-h-[92vh] sm:!w-full sm:!translate-x-[-50%] sm:!translate-y-[-50%] sm:rounded-2xl sm:p-3 sm:[&>button]:absolute sm:[&>button]:right-4 sm:[&>button]:top-4 sm:[&>button]:m-0 ${
            view === "promo"
              ? "sm:!max-w-3xl"
              : "!left-1/2 !top-1/2 !right-auto !bottom-auto !h-auto !max-h-[calc(100dvh_-_1.5rem)] !w-[calc(100%_-_1.5rem)] !max-w-lg !translate-x-[-50%] !translate-y-[-50%] overflow-y-auto [&>button]:absolute [&>button]:right-3 [&>button]:top-3 [&>button]:m-0 sm:!max-w-lg"
          }`}
        >
          {view === "promo" && (
            <div className="flex min-h-full flex-col overflow-hidden bg-[radial-gradient(circle_at_20%_10%,rgba(126,54,170,0.22),transparent_42%),#171021] sm:grid sm:min-h-0 sm:grid-cols-[0.95fr_1.05fr]">
              <div className="relative shrink-0 overflow-hidden bg-[radial-gradient(circle_at_50%_35%,#32104d_0%,#16091f_72%)] sm:h-auto sm:min-h-[500px] sm:rounded-xl">
                <img
                  src={webinar.image_url}
                  alt={`${webinar.title} webinar poster`}
                  className="relative block h-auto w-full sm:absolute sm:inset-0 sm:h-full sm:object-cover sm:object-center"
                  decoding="async"
                />
              </div>
              <div className="relative flex flex-1 flex-col px-5 pb-[max(2rem,calc(env(safe-area-inset-bottom)+1rem))] pt-3 sm:justify-center sm:p-9">
                <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.26em] text-[#FBBF24] sm:mb-3 sm:text-xs">
                  Live webinar
                </div>
                <DialogTitle className="max-w-md font-display text-[1.75rem] font-black leading-[1.05] sm:text-3xl">
                  {webinar.title}
                </DialogTitle>
                <DialogDescription className="mt-2.5 max-w-md whitespace-pre-line text-sm leading-5 text-white/65 sm:mt-3 sm:leading-6">
                  {webinar.description}
                </DialogDescription>
                {webinar.starts_at && (
                  <div className="mt-3.5 flex items-center gap-2.5 text-sm text-white/75 sm:mt-5">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#9B59D0]/15 text-[#C47CFF]">
                      <CalendarDays size={15} />
                    </span>
                    {formatIndiaDateTime(webinar.starts_at)}
                  </div>
                )}
                <div className="mt-3.5 font-display text-[1.75rem] font-black text-white sm:mt-6 sm:text-3xl">
                  {formatPrice(webinar.price_paise)}
                </div>
                <ShineButton
                  type="button"
                  onClick={openForm}
                  variant="gold"
                  className="mt-3.5 min-h-12 w-full !px-6 !py-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FBBF24]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#171021] sm:mt-auto sm:!py-3.5"
                >
                  Reserve my seat
                  <ArrowRight size={18} />
                </ShineButton>
              </div>
            </div>
          )}

          {view === "form" && (
            <div className="flex min-h-[320px] flex-col p-5 sm:p-6 md:p-8">
              <DialogHeader>
                <div className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-[#FBBF24]">
                  Webinar registration
                </div>
                <DialogTitle className="font-display text-2xl font-black">
                  {webinar.title}
                </DialogTitle>
                <DialogDescription className="text-white/55">
                  Enter your details and pay securely with Razorpay.
                </DialogDescription>
              </DialogHeader>

              {checkingAccess ? (
                <div className="flex items-center justify-center gap-3 py-12 text-sm text-white/55">
                  <Loader2 size={18} className="animate-spin text-[#9B59D0]" />
                  Checking your registration...
                </div>
              ) : !user ? (
                <div className="mt-auto flex flex-col items-center pb-1 pt-8 text-center">
                  <p className="mb-4 text-sm text-white/55">
                    Sign in to keep your registration linked to your account.
                  </p>
                  <button
                    type="button"
                    onClick={() => signInWithGoogle()}
                    className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-full bg-white px-6 py-3 text-sm font-bold text-[#0F0B14] shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-white/90 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#171021]"
                  >
                    <svg
                      aria-hidden="true"
                      className="h-5 w-5 shrink-0"
                      viewBox="0 0 24 24"
                    >
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Sign in with Google
                  </button>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  <div>
                    <Label className="text-xs uppercase tracking-widest text-white/60">
                      Full name *
                    </Label>
                    <Input
                      value={form.name}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      className="mt-2 border-white/10 bg-black/30 text-white"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-widest text-white/60">
                      Phone *
                    </Label>
                    <Input
                      value={form.phone}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          phone: event.target.value,
                        }))
                      }
                      className="mt-2 border-white/10 bg-black/30 text-white"
                      placeholder="10-digit mobile number"
                      inputMode="tel"
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/25 p-4">
                    <span className="text-sm text-white/60">Amount payable</span>
                    <span className="font-display text-xl font-black">
                      {formatPrice(webinar.price_paise)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handlePay}
                    disabled={
                      submitting ||
                      form.name.trim().length < 2 ||
                      form.phone.replace(/\D/g, "").length < 10
                    }
                    className="pill-gold inline-flex w-full cursor-pointer items-center justify-center gap-2 py-3.5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard size={16} />
                        Pay {formatPrice(webinar.price_paise)}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {view === "access" && (
            <div className="p-9 text-center sm:p-10">
              <CheckCircle2
                size={58}
                className="mx-auto mb-5 text-emerald-400"
              />
              <DialogTitle className="font-display text-3xl font-black">
                You purchased this webinar
              </DialogTitle>
              <DialogDescription className="mx-auto mt-3 max-w-sm text-white/55">
                Your registration for {webinar.title} is active. Join the
                private WhatsApp group for webinar updates and the joining link.
              </DialogDescription>
              {whatsAppGroupUrl ? (
                <a
                  href={whatsAppGroupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-7 py-3 font-bold text-[#07150b] transition hover:-translate-y-0.5 hover:bg-[#20bd5a]"
                >
                  <MessageCircle size={18} />
                  Join WhatsApp group
                  <ExternalLink size={14} />
                </a>
              ) : (
                <p className="mt-6 rounded-xl border border-[#FBBF24]/15 bg-[#FBBF24]/5 p-3 text-sm text-[#FBBF24]">
                  The WhatsApp group link will be added soon.
                </p>
              )}
            </div>
          )}

          {view === "success" && (
            <div className="p-10 text-center">
              <CheckCircle2
                size={58}
                className="mx-auto mb-5 text-emerald-400"
              />
              <DialogTitle className="font-display text-3xl font-black">
                You&apos;re registered
              </DialogTitle>
              <DialogDescription className="mx-auto mt-3 max-w-sm text-white/55">
                Your payment for {webinar.title} is confirmed. We&apos;ll use
                your account email for webinar updates.
              </DialogDescription>
              <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                {whatsAppGroupUrl && (
                  <a
                    href={whatsAppGroupUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3 font-bold text-[#07150b] transition hover:bg-[#20bd5a]"
                  >
                    <MessageCircle size={17} />
                    Join WhatsApp group
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setView(null)}
                  className="pill-gold px-8 py-3"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
