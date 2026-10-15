/**
 * lib/sim/schedule.ts
 * Schedule expansion, weekday validation, and timeline normalization.
 */

import type { TrainWithStops } from "@/lib/data/types";
import type { SimScheduleStop } from "./types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Checks if the train operates on the specified calendar date.
 */
export function isTrainRunningOnDate(train: TrainWithStops, date: Date): boolean {
  if (!train.days_running || train.days_running.length === 0) {
    return true;
  }
  const dayName = WEEKDAYS[date.getDay()];
  return train.days_running.some((d) => d.toLowerCase().startsWith(dayName.toLowerCase()));
}

/**
 * Expands a train's stop sequence into absolute simulation minutes.
 * Base: departure day 00:00 is minute 0.
 */
export function expandSchedule(train: TrainWithStops): SimScheduleStop[] {
  if (!train.stops || train.stops.length === 0) {
    throw new Error(`Train ${train.train_number} has no stops to simulate.`);
  }

  const sortedStops = [...train.stops].sort((a, b) => a.seq - b.seq);
  const result: SimScheduleStop[] = [];

  for (let i = 0; i < sortedStops.length; i++) {
    const s = sortedStops[i];
    const isOrigin = i === 0;
    const isDestination = i === sortedStops.length - 1;

    const arr = isOrigin ? (s.departure_min ?? 360) : (s.arrival_min ?? s.departure_min ?? 0);
    const dep = isDestination ? arr : (s.departure_min ?? arr + (s.halt_min || 2));

    result.push({
      seq: s.seq,
      stationCode: s.station_code,
      stationName: s.station_name,
      latitude: s.latitude ?? 0,
      longitude: s.longitude ?? 0,
      arrivalMin: arr,
      departureMin: dep,
      haltMin: isOrigin || isDestination ? 0 : Math.max(0, dep - arr),
      distanceKm: s.distance_km,
      dayOffset: s.day_offset,
      timeSource: s.time_source,
    });
  }

  return result;
}
