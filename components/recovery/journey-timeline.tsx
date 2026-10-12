"use client";

import type { TimelineStop } from "@/lib/types";

interface JourneyTimelineProps {
  stops: TimelineStop[];
}

export function JourneyTimeline({ stops }: JourneyTimelineProps) {
  return (
    <section className="bg-surface rounded-xl border border-border p-6 space-y-4">
      <div className="border-b border-hairline pb-2.5">
        <h2 className="micro-label font-semibold text-foreground">
          JOURNEY TIMELINE & STOPS
        </h2>
      </div>

      {/* Thin vertical timeline with small dots and mono times */}
      <div className="relative pl-6 space-y-5 pt-1">
        {/* Thin vertical connecting line */}
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

        {stops.map((stop, idx) => {
          const isOrigin = stop.type === "origin";
          const isDestination = stop.type === "destination";

          return (
            <div key={idx} className="relative flex items-baseline justify-between gap-4 text-xs">
              {/* Small dot on the thin vertical line */}
              <div
                className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full border bg-surface ${
                  isOrigin
                    ? "border-primary bg-primary"
                    : isDestination
                    ? "border-success bg-success"
                    : "border-muted-foreground/60 bg-surface"
                }`}
              />

              {/* Station Name & Platform */}
              <div>
                <p className={`text-sm ${isOrigin || isDestination ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                  {stop.station}
                  <span className="font-mono text-xs ml-1.5 text-muted-foreground">({stop.code})</span>
                </p>
                <p className="font-mono text-[11px] text-muted-foreground mt-0.5">
                  {stop.platform} · <span className="capitalize">{stop.type}</span>
                </p>
              </div>

              {/* Mono Time */}
              <span className="font-mono text-xs font-semibold text-foreground shrink-0">
                {stop.time}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
