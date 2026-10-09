"use client";

import { useSyncExternalStore } from "react";

/**
 * Reactive media query hook using useSyncExternalStore for clean SSR/hydration.
 * Example: useMediaQuery("(min-width: 768px)")
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") return () => {};
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onStoreChange);
      return () => mql.removeEventListener("change", onStoreChange);
    },
    () => {
      if (typeof window === "undefined") return false;
      return window.matchMedia(query).matches;
    },
    () => false
  );
}
