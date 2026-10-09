"use client";

import { useState, useRef, useEffect } from "react";
import { AlertTriangle, HelpCircle, X } from "lucide-react";
import type { AvailabilityInfo } from "@/lib/types";
import { getWaitlistAssessment, getRacAssessment } from "@/lib/confirmation";

interface AvailabilityPopoverProps {
  availability: AvailabilityInfo;
}

export function AvailabilityPopover({ availability }: AvailabilityPopoverProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const status = availability.status || availability.type;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (status === "available") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-success/10 text-success font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-success" />
        <span>Available ({availability.count ?? 12} seats)</span>
      </span>
    );
  }

  const assessment =
    status === "waitlist"
      ? getWaitlistAssessment(availability.wlNumber ?? availability.count ?? 8)
      : getRacAssessment();

  const isRac = status === "rac";

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-semibold border transition-colors ${
          isRac
            ? "bg-warning/15 text-warning border-warning/30 hover:bg-warning/20"
            : "bg-disruption/10 text-disruption border-disruption/20 hover:bg-disruption/20"
        }`}
        aria-expanded={open}
      >
        <AlertTriangle className={`w-3 h-3 ${isRac ? "text-warning" : "text-disruption"}`} />
        <span>
          {isRac
            ? `RAC ${availability.racNumber ?? availability.count ?? 14}`
            : `Waitlist ${availability.wlNumber ?? availability.count ?? 8}`}
        </span>
        <HelpCircle className="w-3 h-3 opacity-80 ml-0.5" />
      </button>

      {open && (
        <div className="absolute left-0 bottom-full mb-2 w-72 p-3 bg-surface border border-border rounded-xl shadow-card z-50 text-xs text-foreground space-y-1 animate-in fade-in-50">
          <div className="flex items-center justify-between font-bold border-b border-border pb-1">
            <span className={isRac ? "text-warning" : "text-disruption"}>
              {isRac ? "What does RAC mean?" : "What does Waitlist mean?"}
            </span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close popover">
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
          <p className="font-semibold text-foreground">{assessment.headline}</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {assessment.explanation}
          </p>
        </div>
      )}
    </div>
  );
}
