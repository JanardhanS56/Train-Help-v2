"use client";

import { useMemo } from "react";
import type { UserPreferences, Trip, DepartureWindow, DeadlineDay, FlexibilityTolerance } from "@/lib/types";
import { Switch } from "@/components/ui/switch";
import { cn } from "cn";

interface TimingSectionProps {
  preferences: UserPreferences;
  activeTrip: Trip | null;
  onChange: (patch: Partial<UserPreferences>) => void;
}

const DEPARTURE_CHIPS: { id: DepartureWindow; label: string; timeRange: string }[] = [
  { id: "any", label: "Any time", timeRange: "All day" },
  { id: "early-morning", label: "Early morning", timeRange: "4:00 AM – 8:00 AM" },
  { id: "morning", label: "Morning", timeRange: "8:00 AM – 12:00 PM" },
  { id: "afternoon", label: "Afternoon", timeRange: "12:00 PM – 4:00 PM" },
  { id: "evening", label: "Evening", timeRange: "4:00 PM – 9:00 PM" },
  { id: "night", label: "Night", timeRange: "9:00 PM – 4:00 AM" },
];

const DEADLINE_DAYS: { id: DeadlineDay; label: string }[] = [
  { id: "same-day", label: "Same day" },
  { id: "next-day", label: "Next day" },
  { id: "in-2-days", label: "In 2 days" },
];

const FLEXIBILITY_OPTIONS: { hours: FlexibilityTolerance; label: string }[] = [
  { hours: 1, label: "±1 hour" },
  { hours: 3, label: "±3 hours" },
  { hours: 6, label: "±6 hours" },
];

export function TimingSection({
  preferences,
  activeTrip,
  onChange,
}: TimingSectionProps) {
  const currentDeparture = preferences.departureWindow;
  const deadlineDay = preferences.deadlineDay;
  const deadlineTime = preferences.deadlineTime || "09:00";
  const isFlexible = preferences.flexibleSchedule;
  const flexHours = preferences.flexibilityHours || 3;

  // Split deadlineTime "HH:mm" into 12-hour components
  const { hour12, minute, ampm } = useMemo(() => {
    const [hhStr, mmStr] = (deadlineTime || "09:00").split(":");
    let h = parseInt(hhStr || "9", 10);
    const m = mmStr || "00";
    const isPm = h >= 12;
    if (h === 0) h = 12;
    else if (h > 12) h -= 12;
    return {
      hour12: h.toString().padStart(2, "0"),
      minute: m,
      ampm: isPm ? "PM" : "AM",
    };
  }, [deadlineTime]);

  function handleTimeChange(newHour12: string, newMinute: string, newAmpm: string) {
    let h = parseInt(newHour12, 10);
    if (newAmpm === "PM" && h < 12) h += 12;
    else if (newAmpm === "AM" && h === 12) h = 0;
    const formatted = `${h.toString().padStart(2, "0")}:${newMinute}`;
    onChange({ deadlineTime: formatted });
  }

  function handleUseTripDeadline() {
    if (!activeTrip?.neededByTime) return;
    const d = new Date(activeTrip.neededByTime);
    const h = d.getHours().toString().padStart(2, "0");
    const m = d.getMinutes().toString().padStart(2, "0");

    // Compute relative day
    let targetDay: DeadlineDay = "same-day";
    const tripStart = activeTrip.segments[0]?.departureTime;
    if (tripStart) {
      const startDay = new Date(tripStart).getDate();
      const endDay = d.getDate();
      const diff = endDay - startDay;
      if (diff >= 2) targetDay = "in-2-days";
      else if (diff === 1) targetDay = "next-day";
    }

    onChange({
      deadlineDay: targetDay,
      deadlineTime: `${h}:${m}`,
    });
  }

  // Arrival summary sentence
  const arrivalSentence = useMemo(() => {
    if (deadlineDay === "none") {
      return "No arrival deadline set (showing all available arrivals).";
    }
    const timeFormatted = `${parseInt(hour12, 10)}:${minute} ${ampm}`;
    const dayStr =
      deadlineDay === "same-day"
        ? "today"
        : deadlineDay === "next-day"
        ? "tomorrow"
        : "in 2 days";
    return `You'll arrive by ${timeFormatted} ${dayStr}.`;
  }, [deadlineDay, hour12, minute, ampm]);

  return (
    <section className="space-y-6 pt-6" aria-labelledby="timing-heading">
      <div>
        <h2 id="timing-heading" className="text-base font-semibold text-foreground">
          Departure & Arrival Timing
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Constrain schedules to fit your travel plans and deadlines.
        </p>
      </div>

      {/* 1. Departure Window Chips */}
      <div className="space-y-2">
        <label id="departure-window-label" className="micro-label block font-semibold text-foreground">
          DEPARTURE TIME WINDOW
        </label>
        <div
          role="radiogroup"
          aria-labelledby="departure-window-label"
          className="grid grid-cols-2 sm:grid-cols-3 gap-2"
        >
          {DEPARTURE_CHIPS.map((chip) => {
            const isSelected = currentDeparture === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onChange({ departureWindow: chip.id })}
                className={cn(
                  "p-2.5 rounded-lg border text-left transition-colors min-h-[44px]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground font-medium"
                    : "border-border bg-surface text-foreground hover:bg-background"
                )}
              >
                <p className="text-xs font-semibold">{chip.label}</p>
                <p
                  className={cn(
                    "text-[10px] mt-0.5",
                    isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                  )}
                >
                  {chip.timeRange}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Arrival Deadline Controls */}
      <div className="space-y-3 p-4 rounded-xl border border-border bg-surface/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="micro-label font-semibold text-foreground">
            LATEST ARRIVAL DEADLINE
          </label>
          <div className="flex items-center gap-2">
            {activeTrip?.neededByTime && (
              <button
                type="button"
                onClick={handleUseTripDeadline}
                className="text-xs text-primary font-medium hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              >
                Use my trip&apos;s deadline
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                onChange({
                  deadlineDay: deadlineDay === "none" ? "next-day" : "none",
                })
              }
              className={cn(
                "h-6 px-2 rounded text-[11px] font-medium border transition-colors",
                deadlineDay === "none"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface text-muted-foreground hover:text-foreground"
              )}
            >
              {deadlineDay === "none" ? "Deadline disabled" : "No deadline"}
            </button>
          </div>
        </div>

        {deadlineDay !== "none" && (
          <div className="space-y-3 pt-1">
            {/* Day Selector Chips */}
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Arrival day">
              {DEADLINE_DAYS.map((day) => {
                const isSelected = deadlineDay === day.id;
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => onChange({ deadlineDay: day.id })}
                    className={cn(
                      "h-8 px-3 rounded-[6px] text-xs font-medium border transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground font-semibold"
                        : "border-border bg-surface text-foreground hover:bg-background"
                    )}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>

            {/* Styled Hour, Minute, AM/PM Selects (No raw browser time input) */}
            <div className="flex items-center gap-2 pt-1">
              <label htmlFor="arrival-hour-select" className="sr-only">
                Arrival hour
              </label>
              <select
                id="arrival-hour-select"
                value={hour12}
                onChange={(e) => handleTimeChange(e.target.value, minute, ampm)}
                className="h-9 px-3 rounded-[6px] border border-border bg-background text-foreground text-xs font-mono font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0")).map(
                  (h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  )
                )}
              </select>

              <span className="text-muted-foreground font-mono font-bold" aria-hidden="true">
                :
              </span>

              <label htmlFor="arrival-minute-select" className="sr-only">
                Arrival minute
              </label>
              <select
                id="arrival-minute-select"
                value={minute}
                onChange={(e) => handleTimeChange(hour12, e.target.value, ampm)}
                className="h-9 px-3 rounded-[6px] border border-border bg-background text-foreground text-xs font-mono font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {["00", "15", "30", "45"].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>

              <label htmlFor="arrival-ampm-select" className="sr-only">
                Arrival AM or PM
              </label>
              <select
                id="arrival-ampm-select"
                value={ampm}
                onChange={(e) => handleTimeChange(hour12, minute, e.target.value)}
                className="h-9 px-3 rounded-[6px] border border-border bg-background text-foreground text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>
        )}

        <p className="text-xs font-medium text-muted-foreground pt-1">{arrivalSentence}</p>
      </div>

      {/* 3. Flexible Schedule Switch & Revealed Tolerance Chips */}
      <div className="space-y-3 p-4 rounded-xl border border-border bg-surface">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <label
              htmlFor="flexible-schedule-switch"
              className="text-xs font-semibold text-foreground cursor-pointer"
            >
              Flexible schedule
            </label>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              We&apos;ll also show trains outside your window if they arrive earlier or have better seats.
            </p>
          </div>
          <Switch
            id="flexible-schedule-switch"
            checked={isFlexible}
            onCheckedChange={(checked) => onChange({ flexibleSchedule: checked })}
            aria-label="Toggle flexible schedule"
          />
        </div>

        {isFlexible && (
          <div className="pt-2 border-t border-hairline flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">Tolerance:</span>
            {FLEXIBILITY_OPTIONS.map((opt) => {
              const isSelected = flexHours === opt.hours;
              return (
                <button
                  key={opt.hours}
                  type="button"
                  onClick={() => onChange({ flexibilityHours: opt.hours })}
                  className={cn(
                    "h-7 px-2.5 rounded-[6px] text-xs font-medium border transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground font-semibold"
                      : "border-border bg-surface text-foreground hover:bg-background"
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
