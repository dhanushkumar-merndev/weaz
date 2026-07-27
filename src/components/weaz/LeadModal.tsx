"use client";

import React, { useState } from "react";
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
import { CheckCircle2, Loader2, MessageSquare } from "lucide-react";

const WHATSAPP_NUMBER = "919722933197";

const PROGRAMS = [
  "Beginner Program",
  "Professional Business Owner",
  "AI Hero Program",
  "Not sure yet",
];

interface LeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProgram?: string;
}

const LeadModal = ({ open, onOpenChange, defaultProgram }: LeadModalProps) => {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    program: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const matchedDefaultProgram = PROGRAMS.find(
    (program) =>
      defaultProgram &&
      program
        .toLowerCase()
        .includes(defaultProgram.toLowerCase().split(" ")[0])
  );
  const selectedProgram =
    form.program || matchedDefaultProgram || defaultProgram || "";

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSuccess(false);
      setError("");
      setLoading(false);
      setForm((current) => ({ ...current, program: "" }));
    }
    onOpenChange(nextOpen);
  };

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    if (!form.name.trim() || form.name.trim().length < 2)
      return "Please enter your full name.";
    if (!/^[+\d][\d\s-]{5,18}$/.test(form.phone.trim()))
      return "Please enter a valid phone number.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      return "Please enter a valid email address.";
    if (!selectedProgram) return "Please choose a program.";
    return "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate();
    if (v) {
      setError(v);
      toast.error(v);
      return;
    }
    setError("");
    setLoading(true);

    try {
      // Build WhatsApp message
      const msgLines = [
        `*New Application - WEAZ Tech*`,
        `👤 *Name:* ${form.name.trim()}`,
        `📞 *Phone:* ${form.phone.trim()}`,
        `✉️ *Email:* ${form.email.trim()}`,
        `🎯 *Program:* ${selectedProgram}`,
      ];

      if (form.message.trim()) {
        msgLines.push(`💬 *Message:* ${form.message.trim()}`);
      }

      const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
        msgLines.join("\n")
      )}`;

      // Open WhatsApp in a new tab
      window.open(waUrl, "_blank");

      setSuccess(true);
      toast.success("Application ready! Opening WhatsApp to send details.");
      setForm({ name: "", phone: "", email: "", program: "", message: "" });
    } catch {
      const errorMsg = "Something went wrong. Please try again.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        data-testid="lead-capture-modal"
        className="max-w-lg bg-[#1A1525] border-white/10 text-white p-0 overflow-hidden"
      >
        <div className="relative p-6 md:p-8">
          <div className="absolute -top-24 -right-24 w-56 h-56 rounded-full bg-[#9B59D0]/25 blur-[80px] pointer-events-none" />
          <DialogHeader className="text-left relative z-10">
            <div className="text-xs uppercase tracking-[0.25em] text-[#FBBF24] font-bold mb-2">
              Priority Application
            </div>
            <DialogTitle className="font-display text-2xl md:text-3xl font-black tracking-tight text-white">
              Reserve your seat
            </DialogTitle>
            <DialogDescription className="text-white/60 mt-1">
              Fill in your details below. Submitting will direct your application to our admissions WhatsApp (+91 97229 33197).
            </DialogDescription>
          </DialogHeader>

          {success ? (
            <div data-testid="lead-success-state" className="mt-8 flex flex-col items-center text-center py-6">
              <div className="w-16 h-16 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/40 grid place-items-center mb-4">
                <CheckCircle2 size={28} className="text-[#22c55e]" />
              </div>
              <h4 className="font-display text-2xl font-bold text-white">You&apos;re almost there!</h4>
              <p className="text-white/60 mt-2 max-w-sm">
                WhatsApp has been opened with your pre-filled application details. Press &quot;Send&quot; in WhatsApp to reach our admissions team instantly.
              </p>
              <button
                data-testid="lead-close-btn"
                onClick={() => handleOpenChange(false)}
                className="pill-gold px-6 py-3 mt-8 text-sm cursor-pointer"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4 relative z-10" data-testid="lead-form">
              <div>
                <Label htmlFor="lead-name" className="text-xs uppercase tracking-widest text-white/60">
                  Full Name
                </Label>
                <Input
                  id="lead-name"
                  data-testid="lead-input-name"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Aarav Sharma"
                  className="mt-2 bg-black/30 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#9B59D0]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lead-phone" className="text-xs uppercase tracking-widest text-white/60">
                    Phone
                  </Label>
                  <Input
                    id="lead-phone"
                    data-testid="lead-input-phone"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="+91 97229 33197"
                    className="mt-2 bg-black/30 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#9B59D0]"
                  />
                </div>
                <div>
                  <Label htmlFor="lead-email" className="text-xs uppercase tracking-widest text-white/60">
                    Email
                  </Label>
                  <Input
                    id="lead-email"
                    data-testid="lead-input-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="you@email.com"
                    className="mt-2 bg-black/30 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#9B59D0]"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs uppercase tracking-widest text-white/60">
                  Program of Interest
                </Label>
                <Select
                  value={selectedProgram}
                  onValueChange={(v) => set("program", v)}
                >
                  <SelectTrigger
                    data-testid="lead-select-program"
                    className="mt-2 bg-black/30 border-white/10 text-white focus:ring-[#9B59D0]"
                  >
                    <SelectValue placeholder="Choose a program" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1525] border-white/10 text-white">
                    {PROGRAMS.map((p) => (
                      <SelectItem
                        key={p}
                        value={p}
                        data-testid={`lead-program-option-${p.toLowerCase().replace(/\s+/g, "-")}`}
                        className="focus:bg-[#9B59D0]/20 focus:text-white"
                      >
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="lead-message" className="text-xs uppercase tracking-widest text-white/60">
                  Message (Optional)
                </Label>
                <Input
                  id="lead-message"
                  data-testid="lead-input-message"
                  value={form.message}
                  onChange={(e) => set("message", e.target.value)}
                  placeholder="Any questions or additional details..."
                  className="mt-2 bg-black/30 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#9B59D0]"
                />
              </div>

              {error ? (
                <div data-testid="lead-error" className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                data-testid="lead-submit-btn"
                className="pill-gold w-full py-3.5 inline-flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <MessageSquare size={16} />}
                {loading ? "Preparing WhatsApp..." : "Send Application via WhatsApp"}
              </button>

              <p className="text-[11px] text-white/40 text-center">
                Submitting will send your application directly to WEAZ Tech WhatsApp (+91 97229 33197).
              </p>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LeadModal;
