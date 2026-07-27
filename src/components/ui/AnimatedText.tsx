"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { motion } from "framer-motion";

interface AnimatedTextProps {
  text: string;
  el?: React.ElementType;
  className?: string;
  delay?: number;
  type?: "gsap-words" | "motion-words";
}

export function AnimatedText({
  text,
  el: Wrapper = "h1",
  className = "",
  delay = 0,
  type = "gsap-words",
}: AnimatedTextProps) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (type !== "gsap-words" || !containerRef.current) return;

    const words = containerRef.current.querySelectorAll(".gsap-word");
    if (words.length === 0) return;

    gsap.fromTo(
      words,
      {
        opacity: 0,
        y: 20,
        rotateX: -30,
      },
      {
        opacity: 1,
        y: 0,
        rotateX: 0,
        duration: 0.6,
        stagger: 0.05,
        delay,
        ease: "power3.out",
      }
    );
  }, [text, delay, type]);

  const words = text.split(" ");

  if (type === "motion-words") {
    return (
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.05,
              delayChildren: delay,
            },
          },
          hidden: {},
        }}
        className={`inline-block ${className}`}
      >
        {words.map((word, i) => (
          <motion.span
            key={i}
            variants={{
              hidden: { opacity: 0, y: 15 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
              },
            }}
            className="inline-block mr-[0.25em] will-change-transform"
          >
            {word}
          </motion.span>
        ))}
      </motion.div>
    );
  }

  return (
    <Wrapper ref={containerRef as any} className={className}>
      {words.map((word, i) => (
        <span key={i} className="gsap-word inline-block mr-[0.25em] will-change-transform">
          {word}
        </span>
      ))}
    </Wrapper>
  );
}
