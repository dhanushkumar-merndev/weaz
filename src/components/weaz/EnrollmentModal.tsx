"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, CreditCard } from "lucide-react";
import {
  loadRazorpayScript,
  type RazorpayOptions,
  type RazorpaySuccessResponse,
} from "@/lib/razorpay-checkout";

interface Program {
  id: number;
  name: string;
  tagline: string;
  audience: string;
  duration: string;
  price_paise: number;
}

interface EnrollmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProgram?: string;
}

function formatPrice(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export function EnrollmentModal({
  open,
  onOpenChange,
  defaultProgram: rawDefault,
}: EnrollmentModalProps) {
  const { user, signInWithGoogle } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const [programs, setPrograms] = useState<Program[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [step, setStep] = useState<
    "form" | "paying" | "processing" | "success"
  >("form");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");

  useEffect(() => {
    if (!open) return;

    supabase.from("programs").select("*").order("id").then(({ data }) => {
      if (data) setPrograms(data);
      setLoadingPrograms(false);

      if (rawDefault && data) {
        const match = data.find(
          (p) =>
            p.name.toLowerCase().includes(rawDefault.toLowerCase().split(" ")[0])
        );
        if (match) setSelectedProgramId(String(match.id));
      }

      if (user) {
        const name =
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          "";
        setForm((f) => ({ ...f, name }));
      }
    });
  }, [open, rawDefault, supabase, user]);

  useEffect(() => {
    if (open) {
      loadRazorpayScript();
    }
  }, [open]);

  const selectedProgram = programs.find(
    (p) => String(p.id) === selectedProgramId
  );

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setStep("form");
      setSubmitting(false);
    }
    onOpenChange(nextOpen);
  };

  const handlePay = async () => {
    if (!form.name.trim() || !form.phone.trim() || !selectedProgramId) {
      toast.error("Please fill all required fields");
      return;
    }

    const enteredDigits = form.phone.replace(/\D/g, "");
    const phoneDigits =
      enteredDigits.length === 12 && enteredDigits.startsWith("91")
        ? enteredDigits.slice(2)
        : enteredDigits;
    if (phoneDigits.length !== 10) {
      toast.error("Phone number must be exactly 10 digits (e.g. 9742933197)");
      return;
    }

    if (!user?.email) {
      toast.error("You must be signed in with a valid email");
      return;
    }

    setSubmitting(true);
    setStep("paying");

    try {
      const checkoutLoaded = await loadRazorpayScript();
      if (!checkoutLoaded || !window.Razorpay) {
        throw new Error(
          "Secure checkout could not load. Check your connection and try again."
        );
      }

      const leadRes = await fetch("/api/leads/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          program_id: Number(selectedProgramId),
          name: form.name.trim(),
          phone: form.phone.trim(),
          message: form.message.trim(),
        }),
      });

      if (!leadRes.ok) {
        const err = await leadRes.json();
        throw new Error(err.error || "Failed to create enrollment");
      }

      const { enrollment } = await leadRes.json();

      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollment_id: enrollment.id }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.json();
        throw new Error(err.error || "Failed to create payment order");
      }

      const { order_id, amount, currency, key_id } = await orderRes.json();

      const options: RazorpayOptions = {
        key: key_id,
        amount,
        currency,
        name: "WEAZ TECH",
        description: selectedProgram?.name || "Program Enrollment",
        order_id,
        prefill: {
          name: form.name.trim(),
          email: user?.email || "",
          contact: form.phone.trim(),
        },
        theme: { color: "#9B59D0" },
        modal: {
          ondismiss: () => {
            setSubmitting(false);
            setStep("form");
          },
        },
        handler: async function (response: RazorpaySuccessResponse) {
          try {
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const result = await verifyRes.json().catch(() => null);

            if (verifyRes.status === 202) {
              setStep("processing");
              toast.info(
                "Payment received. Your enrollment will activate after capture."
              );
            } else if (verifyRes.ok && result?.success === true) {
              setStep("success");
              toast.success("Payment successful! Welcome to WEAZ TECH.");
              window.dispatchEvent(new CustomEvent("enrollment-updated"));
            } else {
              throw new Error(
                result?.error ||
                  "Payment verification failed. Please contact support."
              );
            }
          } catch (error: unknown) {
            const message =
              error instanceof Error
                ? error.message
                : "Payment verification failed. Please contact support.";
            toast.error(message);
            setStep("form");
          } finally {
            setSubmitting(false);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response) => {
        toast.error(
          response.error?.description ||
            "Payment failed. No charge was confirmed."
        );
        setSubmitting(false);
        setStep("form");
      });
      rzp.open();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong"
      );
      setSubmitting(false);
      setStep("form");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      modal={step !== "paying"}
    >
      <DialogContent className="!w-[calc(100%_-_1.5rem)] max-h-[calc(100dvh_-_1.5rem)] max-w-lg overflow-x-hidden overflow-y-auto rounded-2xl border-white/10 bg-[#171021] p-0 text-white shadow-2xl shadow-[#9B59D0]/10 sm:rounded-2xl sm:p-3 [&>button]:right-3 [&>button]:top-3 [&>button]:z-20 [&>button]:grid [&>button]:h-10 [&>button]:w-10 [&>button]:place-items-center [&>button]:rounded-full [&>button]:bg-black/45 [&>button]:text-white [&>button]:opacity-100 [&>button]:backdrop-blur-md [&>button]:focus:ring-0 [&>button]:focus:ring-offset-0 [&>button]:focus-visible:ring-2 [&>button]:focus-visible:ring-white/30">
        <div className="relative flex min-h-[320px] flex-col p-5 sm:p-6 md:p-8">
          {step === "success" || step === "processing" ? (
            <div className="flex flex-col items-center text-center py-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <div
                  className={`w-20 h-20 rounded-full grid place-items-center mb-6 ${
                    step === "success"
                      ? "bg-[#22c55e]/15 border border-[#22c55e]/40"
                      : "bg-[#FBBF24]/15 border border-[#FBBF24]/40"
                  }`}
                >
                  {step === "success" ? (
                    <CheckCircle2 size={40} className="text-[#22c55e]" />
                  ) : (
                    <Loader2
                      size={40}
                      className="text-[#FBBF24] animate-spin"
                    />
                  )}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="font-display text-2xl font-black text-white">
                  {step === "success"
                    ? "Payment Successful!"
                    : "Payment Processing"}
                </h3>
                <p className="text-white/60 mt-2 max-w-sm">
                  {step === "success" ? (
                    <>
                      Welcome to WEAZ TECH! Your enrollment in{" "}
                      <span className="text-[#FBBF24] font-semibold">
                        {selectedProgram?.name}
                      </span>{" "}
                      is confirmed. We&apos;ll reach out to you shortly with next
                      steps.
                    </>
                  ) : (
                    <>
                      Your payment was authorized and is awaiting capture. Your{" "}
                      <span className="text-[#FBBF24] font-semibold">
                        {selectedProgram?.name}
                      </span>{" "}
                      enrollment will activate automatically after Razorpay
                      confirms it.
                    </>
                  )}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <button
                  onClick={() => onOpenChange(false)}
                  className="pill-gold px-8 py-3 mt-8 text-sm cursor-pointer"
                >
                  Done
                </button>
              </motion.div>
            </div>
          ) : (
            <>
              <DialogHeader className="text-left relative z-10">
                <div className="text-xs uppercase tracking-[0.25em] text-[#FBBF24] font-bold mb-2">
                  Secure Enrollment
                </div>
                <DialogTitle className="font-display text-2xl md:text-3xl font-black tracking-tight text-white">
                  {!user ? "Sign in to continue" : "Complete your enrollment"}
                </DialogTitle>
                <DialogDescription className="text-white/60 mt-1">
                  {!user
                    ? "Sign in with Google to proceed with enrollment."
                    : "Fill in your details, select a program, and pay securely."}
                </DialogDescription>
              </DialogHeader>

              {!user ? (
                <div className="mt-auto flex flex-col items-center pb-1 pt-8">
                  <p className="mb-5 max-w-sm text-center text-sm leading-6 text-white/50">
                    Keep your enrollment, payment status, and program access
                    securely linked to one account.
                  </p>
                  <button
                    onClick={() => signInWithGoogle()}
                    className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-full bg-white px-6 py-3 text-sm font-bold text-[#0F0B14] shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-white/90 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#171021]"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Sign in with Google
                  </button>
                </div>
              ) : (
                <div className="mt-6 space-y-4 relative z-10">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs uppercase tracking-widest text-white/60">
                        Full Name *
                      </Label>
                      <Input
                        value={form.name}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, name: e.target.value }))
                        }
                        placeholder="Your name"
                        className="mt-2 bg-black/30 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#9B59D0]"
                      />
                    </div>
                    <div>
                      <Label className="text-xs uppercase tracking-widest text-white/60">
                        Phone *
                      </Label>
                      <Input
                        value={form.phone}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, phone: e.target.value }))
                        }
                        placeholder="Enter 10-digit mobile number"
                        className="mt-2 bg-black/30 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#9B59D0]"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs uppercase tracking-widest text-white/60">
                      Select Program *
                    </Label>
                    <Select
                      value={selectedProgramId}
                      onValueChange={setSelectedProgramId}
                    >
                      <SelectTrigger className="mt-2 bg-black/30 border-white/10 text-white focus:ring-[#9B59D0]">
                        <SelectValue placeholder={loadingPrograms ? "Loading..." : "Choose a program"} />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1A1525] border-white/10 text-white">
                        {programs.map((p) => (
                          <SelectItem
                            key={p.id}
                            value={String(p.id)}
                            className="focus:bg-[#9B59D0]/20 focus:text-white"
                          >
                            {p.name} - {formatPrice(p.price_paise)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs uppercase tracking-widest text-white/60">
                      Message (Optional)
                    </Label>
                    <Input
                      value={form.message}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, message: e.target.value }))
                      }
                      placeholder="Any questions or additional details..."
                      className="mt-2 bg-black/30 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#9B59D0]"
                    />
                  </div>

                  {selectedProgram && (
                    <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                      <div className="text-xs uppercase tracking-widest text-white/50">
                        {selectedProgram.name}
                      </div>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="font-display text-3xl font-black text-white">
                          {formatPrice(selectedProgram.price_paise)}
                        </span>
                        <span className="text-sm text-white/50">
                          / {selectedProgram.duration}
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handlePay}
                    disabled={submitting || !selectedProgramId || !form.name.trim() || !form.phone.trim()}
                    className="pill-gold w-full py-3.5 inline-flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard size={16} />
                        Pay {selectedProgram ? formatPrice(selectedProgram.price_paise) : "Now"}
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
