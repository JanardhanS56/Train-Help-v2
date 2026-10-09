"use client";

import { Clock, Train } from "lucide-react";
import type { TimelineStop } from "@/lib/types";

interface JourneyTimelineProps {
  stops: TimelineStop[];
}

export function JourneyTimeline({ stops }: JourneyTimelineProps) {
  return (
    <section className="bg-surface rounded-xl border border-border p-5 shadow-card space-y-3">
      <div className="flex items-center gap-2 border-b border-border pb-2.5">
        <Clock className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-bold text-foreground">
          Journey Timeline & Scheduled Station Halts
        </h2>
      </div>

      <div className="relative pl-6 space-y-4 pt-1">
        {/* Vertical connecting line */}
        <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-border" />

        {stops.map((stop, idx) => (
          <div key={idx} className="relative flex items-start gap-3 text-xs">
            <div
              className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 bg-surface ${
                stop.type === "origin"
                  ? "border-primary bg-primary"
                  : stop.type === "destination"
                  ? "border-success bg-success"
                  : "border-primary/60 bg-surface"
              }`}
            />
            <div className="flex-1 bg-background p-2.5 rounded-lg border border-border">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 font-bold text-foreground">
                  <Train className="w-3 h-3 text-primary" />
                  <span>{stop.station}</span>
                  <span className="text-[10px] font-mono text-muted-foreground">({stop.code})</span>
                </div>
                <span className="font-semibold text-primary">{stop.time}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-0.5">
                <span>{stop.platform}</span>
                <span className="capitalize">{stop.type}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
