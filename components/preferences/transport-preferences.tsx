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
    <section className="bg-surface rounded-xl border border-border p-5 space-y-3">
      <div>
        <h2 className="text-sm font-medium text-foreground">
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
          className={`flex items-center gap-3 p-3 rounded-lg border text-left ${
            isTrainActive
              ? "border-primary bg-primary text-primary-foreground font-medium"
              : "border-border bg-background"
          }`}
        >
          <div className="w-8 h-8 rounded bg-primary/20 text-current flex items-center justify-center shrink-0">
            <Train className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-medium">Trains</p>
            <p className="text-[10px] opacity-80">Active mode</p>
          </div>
        </button>

        {/* Flight - Disabled */}
        <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30 text-left opacity-50 cursor-not-allowed">
          <div className="w-8 h-8 rounded bg-muted text-muted-foreground flex items-center justify-center shrink-0">
            <Plane className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Flights</p>
            <p className="text-[10px] text-muted-foreground">Coming soon</p>
          </div>
        </div>

        {/* Bus - Disabled */}
        <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30 text-left opacity-50 cursor-not-allowed">
          <div className="w-8 h-8 rounded bg-muted text-muted-foreground flex items-center justify-center shrink-0">
            <Bus className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Buses</p>
            <p className="text-[10px] text-muted-foreground">Coming soon</p>
          </div>
        </div>
      </div>
    </section>
  );
}
