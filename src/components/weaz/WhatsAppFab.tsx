"use client";

import React from "react";
import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "919722933197"; // +91 97229 33197
const WA_TEXT = encodeURIComponent(
  "Hi WEAZ Tech! I'd like to know more about your programs."
);

const WhatsAppFab = () => {
  return (
    <a
      data-testid="whatsapp-fab"
      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WA_TEXT}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-[#22c55e] text-white grid place-items-center shadow-2xl wa-pulse hover:bg-[#16a34a] transition-colors"
    >
      <MessageCircle size={26} />
    </a>
  );
};

export default WhatsAppFab;
