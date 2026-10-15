"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function GlobalLoadingIndicator() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pendingDestination, setPendingDestination] = useState<string | null>(null);

  useEffect(() => {
    function handleNavigation(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) return;

      const link = target.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.target || link.hasAttribute("download")) return;

      const destination = new URL(link.href);
      if (destination.origin !== window.location.origin) return;

      const nextRoute = `${destination.pathname}${destination.search}`;
      const currentRoute = `${window.location.pathname}${window.location.search}`;
      if (nextRoute !== currentRoute) {
        setPendingDestination(nextRoute);
      }
    }

    document.addEventListener("click", handleNavigation, true);
    return () => document.removeEventListener("click", handleNavigation, true);
  }, []);

  useEffect(() => {
    if (!pendingDestination) return;

    const timer = window.setTimeout(() => setPendingDestination(null), 10_000);
    return () => window.clearTimeout(timer);
  }, [pendingDestination]);

  const currentRoute = `${pathname}${searchParams.size ? `?${searchParams}` : ""}`;
  const isNavigating =
    pendingDestination !== null && pendingDestination !== currentRoute;

  if (!isNavigating) return null;

  return (
    <div
      role="progressbar"
      aria-label="Loading page"
      aria-valuetext="Navigating to page"
      className="fixed top-0 left-0 right-0 z-[9999] h-[2.5px] overflow-hidden bg-primary/20 pointer-events-none"
    >
      <div className="h-full bg-gradient-to-r from-primary via-emerald-400 to-primary animate-[progress-pulse_1s_ease-in-out_infinite] motion-reduce:animate-none w-full origin-left" />
    </div>
  );
}
