"use client";

import type { TravelClass } from "@/lib/types";

const travelClasses: { code: TravelClass; label: string; desc: string }[] = [
  { code: "3A", label: "3A", desc: "AC 3-Tier" },
  { code: "2A", label: "2A", desc: "AC 2-Tier" },
  { code: "1A", label: "1A", desc: "AC 1st Class" },
  { code: "SL", label: "SL", desc: "Sleeper Class" },
  { code: "CC", label: "CC", desc: "AC Chair Car" },
  { code: "EC", label: "EC", desc: "Exec Chair Car" },
];

interface ClassPreferencesProps {
  preferredClass: TravelClass | "any";
  onUpdate: (tc: TravelClass | "any") => void;
}

export function ClassPreferences({ preferredClass, onUpdate }: ClassPreferencesProps) {
  return (
    <section className="bg-surface rounded-xl border border-border p-5 shadow-card space-y-3">
      <div>
        <h2 className="text-sm font-bold text-foreground">Preferred Travel Class</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Trains offering your preferred class receive top rank priority.
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {travelClasses.map((tc) => (
          <button
            key={tc.code}
            type="button"
            onClick={() => onUpdate(tc.code)}
            className={`p-2.5 rounded-lg border text-left transition-colors touch-target ${
              preferredClass === tc.code
                ? "border-primary bg-primary/10 text-primary font-semibold"
                : "border-border bg-background text-muted-foreground hover:text-foreground"
            }`}
          >
            <p className="text-xs font-bold">{tc.label}</p>
            <p className="text-[10px] text-muted-foreground">{tc.desc}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
