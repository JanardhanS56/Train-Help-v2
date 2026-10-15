"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function GlobalLoadingIndicator() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    // When pathname or searchParams change, show quick finish transition
    setIsNavigating(true);
    const timer = setTimeout(() => {
      setIsNavigating(false);
    }, 450);
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  if (!isNavigating) return null;

  return (
    <div
      role="progressbar"
      aria-label="Loading page"
      className="fixed top-0 left-0 right-0 z-[9999] h-[2.5px] overflow-hidden bg-primary/20 pointer-events-none"
    >
      <div className="h-full bg-gradient-to-r from-primary via-emerald-400 to-primary animate-[progress-pulse_1s_ease-in-out_infinite] w-full origin-left" />
    </div>
  );
}
