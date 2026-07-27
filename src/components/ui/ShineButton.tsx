"use client";

import React, { ReactNode } from "react";
import { motion, HTMLMotionProps } from "framer-motion";

interface ShineButtonProps extends HTMLMotionProps<"button"> {
  children: ReactNode;
  variant?: "gold" | "purple" | "ghost" | "custom";
  className?: string;
  onClick?: () => void;
  showShine?: boolean;
}

export function ShineButton({
  children,
  variant = "gold",
  className = "",
  onClick,
  showShine = true,
  ...props
}: ShineButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "gold":
        return "pill-gold px-7 py-3.5 text-sm md:text-base font-bold inline-flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#FBBF24]/20 hover:shadow-[#FBBF24]/40 transition-all";
      case "purple":
        return "bg-[#9B59D0] hover:bg-[#8A46BF] text-white font-bold px-7 py-3.5 rounded-full text-sm md:text-base inline-flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#9B59D0]/30 transition-all";
      case "ghost":
        return "pill-ghost px-7 py-3.5 text-sm md:text-base font-semibold inline-flex items-center justify-center gap-2 cursor-pointer transition-all";
      case "custom":
      default:
        return "";
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.96, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      onClick={onClick}
      className={`relative inline-block overflow-hidden rounded-full ${
        showShine ? "btn-shine" : ""
      } ${getVariantStyles()} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
