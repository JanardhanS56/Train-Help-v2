"use client";

import type { UserPreferences, SeatPreferenceType } from "@/lib/types";
import { cn } from "cn";

interface SeatsSectionProps {
  preferences: UserPreferences;
  onChange: (patch: Partial<UserPreferences>) => void;
}

const SEAT_OPTIONS: {
  id: SeatPreferenceType;
  title: string;
  explanation: string;
}[] = [
  {
    id: "confirmed-only",
    title: "Confirmed only",
    explanation: "Guaranteed berth assigned immediately upon ticket issuance.",
  },
  {
    id: "confirmed-or-rac",
    title: "Confirmed or RAC",
    explanation: "RAC (Reservation Against Cancellation) grants full boarding rights with shared seating.",
  },
  {
    id: "any",
    title: "Any, including waitlist",
    explanation: "Allows waitlisted options (GNWL/RLWL) that may confirm prior to final charting.",
  },
];

export function SeatsSection({ preferences, onChange }: SeatsSectionProps) {
  const currentSeat = preferences.seatPreference;

  return (
    <section className="space-y-3 pt-6" aria-labelledby="seats-heading">
      <div>
        <h2 id="seats-heading" className="text-base font-semibold text-foreground">
          Seat & Confirmation Status
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Specify acceptable reservation statuses. Excluded categories will not appear in results.
        </p>
      </div>

      <fieldset
        role="radiogroup"
        aria-labelledby="seats-heading"
        className="space-y-2 border-0 p-0 m-0"
      >
        <legend className="sr-only">Choose seat confirmation requirement</legend>
        {SEAT_OPTIONS.map((opt) => {
          const isSelected = currentSeat === opt.id;
          return (
            <label
              key={opt.id}
              className={cn(
                "flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-colors min-h-[44px] select-none",
                isSelected
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-border bg-surface text-foreground hover:bg-background"
              )}
            >
              <input
                type="radio"
                name="seatPreference"
                value={opt.id}
                checked={isSelected}
                onChange={() => onChange({ seatPreference: opt.id })}
                className="mt-0.5 text-primary focus:ring-primary h-4 w-4 shrink-0"
              />
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">{opt.title}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{opt.explanation}</p>
              </div>
            </label>
          );
        })}
      </fieldset>
    </section>
  );
}
