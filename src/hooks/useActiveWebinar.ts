"use client";

import { useQuery } from "@tanstack/react-query";

export interface ActiveWebinar {
  id: string;
  title: string;
  announcement_text: string;
  description: string;
  price_paise: number;
  image_url: string;
  starts_at: string | null;
}

async function fetchActiveWebinar(): Promise<ActiveWebinar | null> {
  const response = await fetch("/api/webinars/active", {
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) {
    throw new Error("Could not load the active webinar");
  }
  const result = await response.json();
  return result.webinar ?? null;
}

export function useActiveWebinar(enabled = true) {
  return useQuery({
    queryKey: ["active-webinar"],
    queryFn: fetchActiveWebinar,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    retryDelay: (attempt) => Math.min(750 * 2 ** attempt, 3_000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    enabled,
  });
}
