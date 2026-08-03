"use client";

import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import type { WebinarAvailability } from "@/lib/webinar-slots";

export const WEBINAR_AVAILABILITY_QUERY_KEY = "webinar-availability";

async function fetchAvailability(webinarId: string) {
  const response = await fetch(
    `/api/webinars/${encodeURIComponent(webinarId)}/availability`,
    { cache: "no-store", signal: AbortSignal.timeout(10_000) }
  );
  if (!response.ok) {
    throw new Error("Could not load slot availability");
  }
  return (await response.json()) as WebinarAvailability;
}

/**
 * Live free-slot availability straight from the database.
 *
 * `interactive` is set while a registration surface is open, which polls more
 * often. The value is also refreshed whenever the browser tab becomes active
 * again, and can be refreshed on demand after a registration completes.
 */
export function useWebinarAvailability(
  webinarId: string | null | undefined,
  { enabled = true, interactive = false } = {}
) {
  const query = useQuery({
    queryKey: [WEBINAR_AVAILABILITY_QUERY_KEY, webinarId],
    queryFn: () => fetchAvailability(webinarId as string),
    enabled: Boolean(webinarId) && enabled,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: interactive ? 15_000 : 120_000,
    refetchIntervalInBackground: false,
    retry: 1,
  });

  return query;
}

/** Refreshes every mounted availability view, e.g. after a registration. */
export function useRefreshWebinarAvailability() {
  const queryClient = useQueryClient();
  return useCallback(
    (webinarId?: string) =>
      queryClient.invalidateQueries({
        queryKey: webinarId
          ? [WEBINAR_AVAILABILITY_QUERY_KEY, webinarId]
          : [WEBINAR_AVAILABILITY_QUERY_KEY],
      }),
    [queryClient]
  );
}
