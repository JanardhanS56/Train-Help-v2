"use client";

import { ShieldCheck } from "lucide-react";

export function PreviewTransformation() {
  return (
    <div className="bg-surface rounded-xl border border-border p-6 max-w-4xl mx-auto my-8">
      <div className="mb-4">
        <span className="micro-label">
          TRANSFORMATION SEQUENCE
        </span>
        <h2 className="text-base font-medium text-foreground mt-1">
          From cancellation alert to confirmed recovery manifest
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Disrupted */}
        <div className="p-4 rounded-lg border border-disruption/30 bg-disruption-tint text-foreground space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-disruption/20 text-xs">
            <span className="micro-label text-disruption font-semibold">DISRUPTED</span>
            <span className="font-mono text-muted-foreground">PNR 4829104829</span>
          </div>
          <div>
            <p className="font-medium text-sm">Karnataka Express · #12627</p>
            <p className="text-xs text-muted-foreground">Bengaluru (SBC) → New Delhi (NDLS)</p>
          </div>
          <div className="text-xs pt-1 border-t border-hairline font-mono text-muted-foreground">
            <span className="line-through">19:20 → 09:00 (+2)</span> · Cancelled (Maintenance)
          </div>
        </div>

        {/* Recovered */}
        <div className="p-4 rounded-lg border border-primary/40 bg-surface text-foreground space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-hairline text-xs">
            <span className="micro-label text-primary font-semibold">CONFIRMED MATCH</span>
            <span className="font-mono text-muted-foreground">PNR 4829104829</span>
          </div>
          <div>
            <p className="font-medium text-sm">Rajdhani Express · #22691</p>
            <p className="text-xs text-muted-foreground">Bengaluru (SBC) → H. Nizamuddin (NZM)</p>
          </div>
          <div className="text-xs pt-1 border-t border-hairline font-mono text-success">
            20:00 → 05:30 (+2) · Direct · Confirmed 3A
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-hairline flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="w-4 h-4 text-success stroke-[1.5]" />
        <span>Automated recovery algorithm prioritises arrival fit and confirmed berths over Waitlist/RAC.</span>
      </div>
    </div>
  );
}
