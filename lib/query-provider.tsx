"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

/**
 * App-wide TanStack Query client. One instance per browser tab — kept in
 * `useState` so the same client survives Fast Refresh in dev and never
 * leaks across requests on the server (this component is "use client" so
 * the SSR pass renders against a fresh client per request anyway).
 *
 * Defaults are tuned for a marketplace UX:
 *   - 60s staleTime: discovery results don't whip-flicker on tab refocus.
 *   - 5min gcTime: keeps recently-viewed venues hot in the cache so back-
 *     navigation feels instant.
 *   - retry=1: one retry is enough for flaky networks; further retries
 *     just delay surfacing real failures.
 *
 * Mutations don't auto-retry — duplicate POSTs are usually wrong.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            gcTime: 5 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
