"use client";

import { Train, Plane, Bus } from "lucide-react";
import type { UserPreferences } from "@/lib/types";

interface TransportPreferencesProps {
  prefs: UserPreferences;
  onUpdate: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
}

export function TransportPreferences({ prefs, onUpdate }: TransportPreferencesProps) {
  const isTrainActive = prefs.preferredTransport === "train";

  return (
    <section className="bg-surface rounded-xl border border-border p-5 shadow-card space-y-3">
      <div>
        <h2 className="text-sm font-bold text-foreground">
          Preferred Transport Mode
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Train disruption recovery active for Indian Railways.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Train - Active */}
        <button
          type="button"
          onClick={() => onUpdate("preferredTransport", "train")}
          className={`flex items-center gap-3 p-3 rounded-lg border-2 text-left touch-target ${
            isTrainActive
              ? "border-primary bg-primary/[0.03]"
              : "border-border bg-background"
          }`}
        >
          <div className="w-8 h-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center shrink-0">
            <Train className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">Trains</p>
            <p className="text-[10px] text-success font-medium">Active mode</p>
          </div>
        </button>

        {/* Flight - Disabled */}
        <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/40 text-left opacity-60 cursor-not-allowed">
          <div className="w-8 h-8 rounded-md bg-muted text-muted-foreground flex items-center justify-center shrink-0">
            <Plane className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-muted-foreground">Flights</p>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted-foreground/15 text-muted-foreground uppercase font-bold tracking-wider">
                Coming soon
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">Air recovery</p>
          </div>
        </div>

        {/* Bus - Disabled */}
        <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/40 text-left opacity-60 cursor-not-allowed">
          <div className="w-8 h-8 rounded-md bg-muted text-muted-foreground flex items-center justify-center shrink-0">
            <Bus className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-muted-foreground">Buses</p>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted-foreground/15 text-muted-foreground uppercase font-bold tracking-wider">
                Coming soon
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">Intercity luxury</p>
          </div>
        </div>
      </div>
    </section>
  );
}
