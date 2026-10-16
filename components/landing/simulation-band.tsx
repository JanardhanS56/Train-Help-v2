import React from "react";
import Link from "next/link";
import { Activity, ArrowRight } from "lucide-react";

export function SimulationBand() {
  return (
    <section
      id="simulation"
      aria-labelledby="heading-simulation-band"
      className="scroll-mt-20 bg-primary text-primary-foreground py-16 px-4 md:px-6"
    >
      <div className="max-w-[1120px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="space-y-4 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-foreground/15 text-primary-foreground text-xs font-medium">
            <Activity className="w-3.5 h-3.5" />
            <span>INTERACTIVE TEST ENVIRONMENT</span>
          </div>

          <h2
            id="heading-simulation-band"
            className="text-2xl sm:text-3xl font-display font-medium tracking-tight text-primary-foreground"
          >
            Experience rail disruptions safely in simulation.
          </h2>

          <p className="text-sm text-primary-foreground/80 leading-relaxed">
            Test how TravelRescue reacts when major rake delays or sudden route
            cancellations occur. Observe deterministic scoring and real-time
            re-ranking without touching active railway databases.
          </p>

          {/* Plain Non-interactive tags (not buttons, no hover affordance) */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-[11px] font-mono font-medium px-2.5 py-1 rounded border border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground cursor-default select-none">
              Cancelled
            </span>
            <span className="text-[11px] font-mono font-medium px-2.5 py-1 rounded border border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground cursor-default select-none">
              Delayed
            </span>
            <span className="text-[11px] font-mono font-medium px-2.5 py-1 rounded border border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground cursor-default select-none">
              Platform change
            </span>
          </div>
        </div>

        {/* Real destination link to /simulation */}
        <div className="shrink-0">
          <Link
            href="/simulation"
            className="h-11 px-6 rounded-xl bg-background text-foreground text-sm font-semibold hover:bg-surface transition-colors flex items-center justify-center gap-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-background focus:ring-offset-2 focus:ring-offset-primary"
          >
            <span>Run the simulation</span>
            <ArrowRight className="w-4 h-4 stroke-[1.8]" />
          </Link>
        </div>
      </div>
    </section>
  );
}
