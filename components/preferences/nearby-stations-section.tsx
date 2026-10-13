"use client";

import { useMemo } from "react";
import type { UserPreferences, Trip, NearbyStation } from "@/lib/types";
import { NEARBY_STATIONS } from "@/lib/constants";
import { Switch } from "@/components/ui/switch";
import { cn } from "cn";

interface NearbyStationsSectionProps {
  preferences: UserPreferences;
  activeTrip: Trip | null;
  onChange: (patch: Partial<UserPreferences>) => void;
}

export function NearbyStationsSection({
  preferences,
  activeTrip,
  onChange,
}: NearbyStationsSectionProps) {
  const isEnabled = preferences.includeNearbyStations;
  const selectedCodes = preferences.selectedNearbyStationCodes || [];

  // Determine origin city from active trip
  const originCity = activeTrip?.segments[0]?.departureStation?.city || "Bengaluru";
  const originStationName = activeTrip?.segments[0]?.departureStation?.name || "Original Station";
  const originStationCode = activeTrip?.segments[0]?.departureStation?.code || "SBC";

  const availableNearby: NearbyStation[] = useMemo(() => {
    return NEARBY_STATIONS[originCity] || NEARBY_STATIONS["Bengaluru"] || [];
  }, [originCity]);

  // Valid codes for current active city
  const validCityCodes = useMemo(
    () => new Set(availableNearby.map((s) => s.code)),
    [availableNearby]
  );

  function handleToggleStation(code: string) {
    if (selectedCodes.includes(code)) {
      const remaining = selectedCodes.filter((c) => c !== code);
      onChange({ selectedNearbyStationCodes: remaining });
    } else {
      // Add valid code
      onChange({ selectedNearbyStationCodes: [...selectedCodes, code] });
    }
  }

  function handleToggleSwitch(checked: boolean) {
    // When turning on, filter saved choices to keep only valid ones for the current trip's city
    const sanitizedCodes = selectedCodes.filter((c) => validCityCodes.has(c));
    onChange({
      includeNearbyStations: checked,
      selectedNearbyStationCodes: sanitizedCodes,
    });
  }

  return (
    <section className="space-y-4 pt-6" aria-labelledby="nearby-heading">
      <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-border bg-surface">
        <div className="space-y-0.5">
          <h2 id="nearby-heading" className="text-sm font-semibold text-foreground">
            Also check nearby stations
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Expand departure search beyond {originStationName} ({originStationCode}) to include nearby railway stations in {originCity}.
          </p>
        </div>

        <Switch
          id="nearby-stations-switch"
          checked={isEnabled}
          onCheckedChange={handleToggleSwitch}
          aria-label="Also check nearby stations"
        />
      </div>

      {isEnabled && (
        <div className="space-y-2.5 p-4 rounded-xl border border-border/80 bg-background/50">
          <div className="flex items-center justify-between">
            <span className="micro-label font-semibold text-foreground">
              NEARBY STATIONS IN {originCity.toUpperCase()}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {selectedCodes.length === 0
                ? "All nearby stations included"
                : `${selectedCodes.length} of ${availableNearby.length} selected`}
            </span>
          </div>

          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label={`Nearby stations in ${originCity}`}
          >
            {availableNearby.map((st) => {
              const isSelected = selectedCodes.includes(st.code);
              return (
                <button
                  key={st.code}
                  type="button"
                  role="checkbox"
                  aria-checked={isSelected}
                  onClick={() => handleToggleStation(st.code)}
                  className={cn(
                    "px-3 py-2 rounded-lg border text-left text-xs transition-colors min-h-[44px] flex flex-col justify-center",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground font-medium"
                      : "border-border bg-surface text-foreground hover:bg-background"
                  )}
                >
                  <span className="font-semibold">
                    {st.name} ({st.code})
                  </span>
                  <span
                    className={cn(
                      "text-[10px] mt-0.5",
                      isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                    )}
                  >
                    +{st.travelTime} from center · {st.distance}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="text-[11px] text-muted-foreground">
            {selectedCodes.length === 0
              ? "Tip: Click a station chip to restrict alternatives specifically to that station, or leave unselected to search all nearby terminals."
              : "Trains departing from both your original station and selected nearby stations will appear in results."}
          </p>
        </div>
      )}
    </section>
  );
}
