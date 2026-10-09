"use client";

import { AlertTriangle, CheckCircle2, ShieldCheck, Train } from "lucide-react";

export function PreviewTransformation() {
  return (
    <div className="bg-surface rounded-2xl border border-border p-6 md:p-8 shadow-card max-w-4xl mx-auto my-10">
      <div className="text-center mb-6">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-2.5 py-1 rounded-full bg-background border border-border">
          Live Transformation Preview
        </span>
        <h2 className="text-lg font-bold text-foreground mt-2">
          From train cancellation to confirmed berths in under 2 minutes
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Step 1: Disrupted Train */}
        <div className="p-5 rounded-xl border border-disruption/30 bg-disruption/[0.03] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/80">
            <span className="text-xs font-bold text-disruption flex items-center gap-1.5 uppercase tracking-wide">
              <AlertTriangle className="w-3.5 h-3.5" />
              Disruption Detected
            </span>
            <span className="font-mono text-xs text-muted-foreground">PNR 4829104829</span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Train className="w-4 h-4 text-disruption" />
              <p className="font-bold text-foreground text-sm">Karnataka Express · 12627</p>
            </div>
            <p className="text-xs text-muted-foreground">Bengaluru City (SBC) → New Delhi (NDLS)</p>
          </div>

          <div className="p-3 rounded-lg bg-background border border-border text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Original Dep / Arr:</span>
              <span className="line-through text-muted-foreground">19:20 → 09:00 (+2 days)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className="font-semibold text-disruption">Cancelled (Track maintenance)</span>
            </div>
            <div className="flex justify-between text-foreground">
              <span className="text-muted-foreground">Meeting in Delhi:</span>
              <span className="font-semibold text-primary">Needed by 09:00 AM</span>
            </div>
          </div>
        </div>

        {/* Step 2: Recovered Train */}
        <div className="p-5 rounded-xl border-2 border-primary bg-primary/[0.02] space-y-4 shadow-card">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <span className="text-xs font-bold text-success flex items-center gap-1.5 uppercase tracking-wide">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Recovered & Confirmed
            </span>
            <span className="text-[11px] font-semibold text-primary px-2 py-0.5 rounded bg-primary/10">
              Best Match
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Train className="w-4 h-4 text-primary" />
              <p className="font-bold text-foreground text-sm">Rajdhani Express · 22691</p>
            </div>
            <p className="text-xs text-muted-foreground">Bengaluru City (SBC) → H. Nizamuddin (NZM)</p>
          </div>

          <div className="p-3 rounded-lg bg-background border border-border text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">New Dep / Arr:</span>
              <span className="font-bold text-success">20:00 → 05:30 (+2 days) · Direct</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fare Difference:</span>
              <span className="font-semibold text-foreground">+₹650 (within ₹3,500 budget)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Arrival Fit:</span>
              <span className="font-semibold text-success">3h 30m before Delhi meeting</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-border flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="w-4 h-4 text-success" />
        <span>Automated recovery prioritises arrival deadlines, confirmed berths over Waitlist/RAC, and transparent fare rules.</span>
      </div>
    </div>
  );
}
