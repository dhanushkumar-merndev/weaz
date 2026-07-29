"use client";
/* Supabase serves an already resized WebP from a dynamic public bucket URL. */
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
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
import { useAuth } from "@/providers/AuthProvider";
import {
  loadRazorpayScript,
  type RazorpayOptions,
  type RazorpaySuccessResponse,
} from "@/lib/razorpay-checkout";
import { useActiveWebinar } from "@/hooks/useActiveWebinar";

type ModalView = "promo" | "form" | "access" | "success" | null;

function formatPrice(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function WebinarExperience() {
  const pathname = usePathname();
  const { user, signInWithGoogle } = useAuth();
  const startedAt = useRef<number | null>(null);
  const promoHandled = useRef(false);
  const barRef = useRef<HTMLDivElement>(null);
  const [barVisible, setBarVisible] = useState(true);
  const [view, setView] = useState<ModalView>(null);
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
    if (!webinar) return;
    if (promoHandled.current) return;

    const elapsed = Date.now() - (startedAt.current ?? Date.now());
    const timer = window.setTimeout(() => {
      if (view === null && !promoHandled.current) {
        promoHandled.current = true;
        setView("promo");
      }
    }, Math.max(0, 10_000 - elapsed));
    return () => window.clearTimeout(timer);
  }, [webinar, view]);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    if (!webinar || !barVisible || excluded) {
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
  }, [barVisible, excluded, webinar]);

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
      {barVisible && (
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

      <Dialog open={view !== null} onOpenChange={closeModal}>
        <DialogContent
          className={`max-h-[92vh] overflow-y-auto border-white/10 bg-[#15111D] p-0 text-white shadow-2xl shadow-[#9B59D0]/10 ${
            view === "promo" ? "sm:max-w-3xl" : "sm:max-w-lg"
          }`}
        >
          {view === "promo" && (
            <div className="grid overflow-hidden sm:grid-cols-[0.95fr_1.05fr]">
              <div className="relative min-h-64 bg-black sm:min-h-[470px]">
                <img
                  src={webinar.image_url}
                  alt={`${webinar.title} webinar poster`}
                  className="absolute inset-0 h-full w-full object-cover"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#15111D]/80 via-transparent to-transparent sm:bg-gradient-to-r" />
              </div>
              <div className="flex flex-col justify-center p-6 sm:p-9">
                <div className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-[#FBBF24]">
                  Live webinar
                </div>
                <DialogTitle className="font-display text-3xl font-black leading-tight">
                  {webinar.title}
                </DialogTitle>
                <DialogDescription className="mt-3 whitespace-pre-line text-sm leading-6 text-white/60">
                  {webinar.description}
                </DialogDescription>
                {webinar.starts_at && (
                  <div className="mt-5 flex items-center gap-2 text-sm text-white/70">
                    <CalendarDays size={16} className="text-[#9B59D0]" />
                    {formatDate(webinar.starts_at)}
                  </div>
                )}
                <div className="mt-6 font-display text-3xl font-black text-white">
                  {formatPrice(webinar.price_paise)}
                </div>
                <button
                  type="button"
                  onClick={openForm}
                  className="pill-gold mt-6 inline-flex cursor-pointer items-center justify-center gap-2 px-6 py-3"
                >
                  Reserve my seat
                  <CreditCard size={16} />
                </button>
              </div>
            </div>
          )}

          {view === "form" && (
            <div className="p-6 sm:p-8">
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
                <div className="py-10 text-center">
                  <p className="mb-5 text-sm text-white/55">
                    Sign in to keep your registration linked to your account.
                  </p>
                  <button
                    type="button"
                    onClick={() => signInWithGoogle()}
                    className="rounded-xl bg-white px-6 py-3 font-bold text-[#0F0B14] transition hover:bg-white/90"
                  >
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
