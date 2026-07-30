"use client";

import { useEffect, useRef, ReactNode } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

function resetToTop(lenis: Lenis) {
  lenis.scrollTo(0, { immediate: true, force: true });
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
}

function syncToLocation(lenis: Lenis, attemptsRemaining = 12) {
  const encodedId = window.location.hash.slice(1);
  if (!encodedId) {
    resetToTop(lenis);
    return;
  }

  let id: string;
  try {
    id = decodeURIComponent(encodedId);
  } catch {
    id = encodedId;
  }

  const target = document.getElementById(id);
  if (target) {
    lenis.scrollTo(target, { immediate: true, force: true });
    return;
  }

  // A destination rendered by the next route may not exist on the first frame.
  if (attemptsRemaining > 0) {
    requestAnimationFrame(() =>
      syncToLocation(lenis, attemptsRemaining - 1)
    );
  }
}

export default function SmoothScroll({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      smoothWheel: true,
    });

    lenisRef.current = lenis;

    let animationFrame = 0;
    function raf(time: number) {
      lenis.raf(time);
      animationFrame = requestAnimationFrame(raf);
    }

    animationFrame = requestAnimationFrame(raf);

    const resetBeforeNavigation = () => {
      resetToTop(lenis);
    };
    const handleHashChange = () =>
      requestAnimationFrame(() => syncToLocation(lenis));

    window.addEventListener("weaz-route-start", resetBeforeNavigation);
    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("weaz-route-start", resetBeforeNavigation);
      window.removeEventListener("hashchange", handleHashChange);
      cancelAnimationFrame(animationFrame);
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    // Lenis can retain the previous document's position across Next.js routes.
    // Respect a destination hash; otherwise reset a newly opened route to top.
    const lenis = lenisRef.current;
    if (!lenis) return;
    requestAnimationFrame(() => syncToLocation(lenis));
  }, [pathname]);

  return <>{children}</>;
}
