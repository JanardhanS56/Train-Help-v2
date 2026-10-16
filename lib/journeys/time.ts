/**
 * lib/journeys/time.ts
 * Time and calendar utilities for Indian Railways schedules in Indian Standard Time (UTC+5:30).
 * All formatting and parsing is pure and host-timezone independent.
 */

import type { DbTrainStop } from "@/lib/data/types";
import type { StopTimeResolution } from "./types";

export const IST_OFFSET_MINUTES = 330; // +05:30

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export type WeekdayShort = (typeof WEEKDAYS)[number];

/**
 * Returns IST date string formatted as YYYY-MM-DD for a given reference Date.
 */
export function getTodayIST(referenceDate: Date = new Date()): string {
  return formatISTDate(referenceDate);
}

/**
 * Parses a YYYY-MM-DD string into a Date representing 00:00:00 in IST.
 */
export function parseISTDate(dateInput: string | Date): Date {
  if (dateInput instanceof Date) {
    const ymd = formatISTDate(dateInput);
    return parseISTDate(ymd);
  }

  const [yearStr, monthStr, dayStr] = dateInput.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);

  // UTC epoch timestamp representing 00:00:00 IST on that calendar day
  return new Date(Date.UTC(year, month, day, 0, 0, 0) - IST_OFFSET_MINUTES * 60_000);
}

/**
 * Formats a Date into HH:mm in IST, host-timezone independent.
 */
export function formatISTTime(date: Date): string {
  const istMillis = date.getTime() + IST_OFFSET_MINUTES * 60_000;
  const shifted = new Date(istMillis);
  const hours = String(shifted.getUTCHours()).padStart(2, "0");
  const minutes = String(shifted.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Formats a Date into YYYY-MM-DD in IST, host-timezone independent.
 */
export function formatISTDate(date: Date): string {
  const istMillis = date.getTime() + IST_OFFSET_MINUTES * 60_000;
  const shifted = new Date(istMillis);
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const day = String(shifted.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns the short weekday ("Sun", "Mon", etc.) in IST for a given Date.
 */
export function getISTWeekday(date: Date): WeekdayShort {
  const istMillis = date.getTime() + IST_OFFSET_MINUTES * 60_000;
  const shifted = new Date(istMillis);
  return WEEKDAYS[shifted.getUTCDay()];
}

/**
 * Checks whether a train runs on a passenger's chosen boarding date at a specific stop.
 * The train's departure from its origin station occurs:
 *   originDepartureDate = boardingDate - boardingStop.day_offset (in days)
 * The train runs if and only if train.days_running includes the weekday of originDepartureDate.
 */
export function runsOnBoardingDate(
  train: { days_running: string[] },
  boardingStop: { day_offset: number },
  boardingDateInput: Date | string
): boolean {
  if (!train.days_running || train.days_running.length === 0) return true;

  const boardingDate = parseISTDate(boardingDateInput);
  // Shift back by day_offset days (24h = 86,400,000 ms)
  const originTime = boardingDate.getTime() - (boardingStop.day_offset || 0) * 86_400_000;
  const originDate = new Date(originTime);
  const originWeekday = getISTWeekday(originDate);

  return train.days_running.includes(originWeekday);
}

/**
 * Converts database minutes since origin-day 00:00 into real IST Dates for all stops.
 */
export function resolveStopTimes(
  trainStops: DbTrainStop[],
  originDateInput: Date | string
): StopTimeResolution[] {
  const originMidnight = parseISTDate(originDateInput);
  const originBaseMs = originMidnight.getTime();

  return trainStops.map((stop) => {
    const arrDate =
      stop.arrival_min !== null
        ? new Date(originBaseMs + stop.arrival_min * 60_000)
        : null;

    const depDate =
      stop.departure_min !== null
        ? new Date(originBaseMs + stop.departure_min * 60_000)
        : null;

    const dayOffset = stop.day_offset ?? 0;
    const dayLabel = dayOffset > 0 ? `+${dayOffset} day` : "";

    return {
      stop,
      arrivalDate: arrDate,
      departureDate: depDate,
      arrivalFormatted: arrDate ? formatISTTime(arrDate) : null,
      departureFormatted: depDate ? formatISTTime(depDate) : null,
      dayOffset,
      dayLabel,
    };
  });
}
