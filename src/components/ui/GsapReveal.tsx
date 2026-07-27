"use client";

import React, { useEffect, useRef, ReactNode } from "react";
import gsap from "gsap";

interface GsapRevealProps {
  children: ReactNode;
  className?: string;
  direction?: "up" | "down" | "left" | "right" | "none";
  distance?: number;
  duration?: number;
  delay?: number;
  stagger?: number;
  threshold?: number;
}

export function GsapReveal({
  children,
  className = "",
  direction = "up",
  distance = 30,
  duration = 0.7,
  delay = 0,
  stagger = 0,
  threshold = 0.15,
}: GsapRevealProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const animatedRef = useRef(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const children = el.children;
    if (children.length === 0) return;

    const getOffset = () => {
      switch (direction) {
        case "up": return { y: distance, x: 0 };
        case "down": return { y: -distance, x: 0 };
        case "left": return { x: distance, y: 0 };
        case "right": return { x: -distance, y: 0 };
        default: return { x: 0, y: 0 };
      }
    };

    const { x, y } = getOffset();

    gsap.set(children, { opacity: 0, x, y });

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !animatedRef.current) {
          animatedRef.current = true;
          gsap.to(children, {
            opacity: 1,
            x: 0,
            y: 0,
            duration,
            delay,
            stagger,
            ease: "power3.out",
          });
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [direction, distance, duration, delay, stagger, threshold]);

  return (
    <div ref={sectionRef} className={className}>
      {children}
    </div>
  );
}
