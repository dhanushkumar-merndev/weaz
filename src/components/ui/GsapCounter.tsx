"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";

interface GsapCounterProps {
  end: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
  decimals?: number;
}

export function GsapCounter({
  end,
  prefix = "",
  suffix = "",
  duration = 2,
  className = "",
  decimals = 0,
}: GsapCounterProps) {
  const [displayValue, setDisplayValue] = useState("0");
  const countRef = useRef<HTMLSpanElement>(null);
  const animatedRef = useRef(false);

  useEffect(() => {
    const el = countRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !animatedRef.current) {
          animatedRef.current = true;
          const obj = { val: 0 };
          gsap.to(obj, {
            val: end,
            duration,
            ease: "power2.out",
            onUpdate: () => {
              setDisplayValue(
                decimals > 0
                  ? obj.val.toFixed(decimals)
                  : Math.floor(obj.val).toLocaleString()
              );
            },
          });
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration, decimals]);

  return (
    <span ref={countRef} className={className}>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
}
