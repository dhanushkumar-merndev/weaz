"use client";

import React from "react";

const WHATSAPP_NUMBER = "919742933197"; // +91 97429 33197
const WA_TEXT = encodeURIComponent(
  "Hi WEAZ Tech! I'd like to know more about your programs."
);

const WhatsAppIcon = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 32 32"
    className="h-8 w-8"
    fill="currentColor"
  >
    <path d="M16.004 3C8.836 3 3.006 8.828 3.006 15.993c0 2.291.598 4.525 1.734 6.494L2.9 29.207l6.876-1.803a12.96 12.96 0 0 0 6.222 1.585h.006C23.169 28.989 29 23.16 29 15.995 29 8.829 23.17 3 16.004 3Zm0 23.795h-.005a10.77 10.77 0 0 1-5.491-1.504l-.394-.234-4.08 1.07 1.089-3.975-.257-.408a10.77 10.77 0 0 1-1.656-5.751c0-5.95 4.842-10.79 10.798-10.79 5.95 0 10.79 4.84 10.79 10.792 0 5.95-4.842 10.8-10.794 10.8Zm5.918-8.083c-.324-.162-1.92-.947-2.218-1.055-.297-.108-.514-.162-.73.163-.216.324-.838 1.055-1.027 1.271-.19.217-.379.244-.703.081-.324-.162-1.368-.504-2.606-1.608a9.76 9.76 0 0 1-1.805-2.246c-.19-.324-.02-.5.142-.661.146-.145.324-.379.487-.568.162-.19.216-.325.324-.541.108-.216.054-.406-.027-.568-.081-.162-.73-1.758-1-2.407-.263-.632-.53-.546-.73-.556l-.622-.011c-.216 0-.568.081-.865.406-.298.324-1.136 1.109-1.136 2.705 0 1.596 1.163 3.138 1.325 3.354.162.216 2.288 3.493 5.543 4.899.774.334 1.378.533 1.849.682.777.247 1.484.212 2.043.129.623-.093 1.92-.785 2.19-1.542.271-.758.271-1.407.19-1.542-.081-.135-.298-.216-.622-.379Z" />
  </svg>
);

const WhatsAppFab = () => {
  return (
    <a
      data-testid="whatsapp-fab"
      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WA_TEXT}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
      title="Chat with us on WhatsApp"
      className="wa-pulse group fixed right-4 bottom-4 z-40 grid h-14 w-14 place-items-center rounded-full border border-white/20 bg-gradient-to-br from-[#2ee66b] to-[#16a74e] text-white shadow-[0_10px_30px_rgba(18,140,73,0.4)] transition duration-200 hover:-translate-y-1 hover:scale-105 hover:shadow-[0_14px_36px_rgba(18,140,73,0.55)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#25d366]/35 sm:right-6 sm:bottom-6 sm:h-[60px] sm:w-[60px]"
    >
      <span className="transition-transform duration-200 group-hover:scale-105">
        <WhatsAppIcon />
      </span>
    </a>
  );
};

export default WhatsAppFab;
