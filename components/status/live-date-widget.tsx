"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { formatLiveTopBarDate } from "@/lib/status/departure-engine";
import { useHydrated } from "@/hooks/use-hydrated";

export function LiveDateWidget() {
  const isHydrated = useHydrated();
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 15000); // 15s refresh for accurate minutes

    return () => clearInterval(timer);
  }, []);

  if (!isHydrated) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/40 border border-border/60 text-muted-foreground font-mono text-[11px] select-none">
        <Clock className="w-3.5 h-3.5 stroke-[1.5] text-primary" />
        <span>Live Clock</span>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/40 border border-border/60 text-foreground font-mono text-[11px] font-medium tracking-tight select-none shadow-2xs"
      title="System live time (auto-synchronized)"
      aria-label={`Live date and time: ${formatLiveTopBarDate(currentDate)}`}
    >
      <Clock className="w-3.5 h-3.5 stroke-[1.5] text-primary shrink-0" />
      <span>{formatLiveTopBarDate(currentDate)}</span>
    </div>
  );
}
