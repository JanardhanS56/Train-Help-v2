/**
 * Formatting utilities for dates, times, currency, and durations.
 * Uses Intl APIs for locale-aware formatting.
 */

// ─── Currency ──────────────────────────────────────────────────────

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount);
}

export function formatPriceDifference(diff: number): string {
  if (diff === 0) return "No extra cost";
  const formatted = currencyFormatter.format(Math.abs(diff));
  return diff > 0 ? `+${formatted}` : `-${formatted}`;
}

export const formatFareDifference = formatPriceDifference;

// ─── Date & Time ───────────────────────────────────────────────────

function toValidDate(input: unknown): Date | null {
  if (!input) return null;
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input;
  }
  if (typeof input === "string") {
    const parsed = new Date(input);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
    const timeMatch = input.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (timeMatch) {
      const now = new Date();
      now.setHours(parseInt(timeMatch[1], 10), parseInt(timeMatch[2], 10), timeMatch[3] ? parseInt(timeMatch[3], 10) : 0, 0);
      return now;
    }
    return null;
  }
  if (typeof input === "number") {
    const parsed = new Date(input);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

const timeFormatter = new Intl.DateTimeFormat("en-IN", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

const fullDateFormatter = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function formatTime(date: Date | string | number): string {
  const d = toValidDate(date);
  if (!d) {
    if (typeof date === "string" && /^\d{1,2}:\d{2}/.test(date)) {
      return date.slice(0, 5);
    }
    return "--:--";
  }
  return timeFormatter.format(d);
}

export function formatDate(date: Date | string | number): string {
  const d = toValidDate(date);
  if (!d) return "--";
  return dateFormatter.format(d);
}

export function formatFullDate(date: Date | string | number): string {
  const d = toValidDate(date);
  if (!d) return "--";
  return fullDateFormatter.format(d);
}

export function formatDateTime(date: Date | string | number): string {
  const d = toValidDate(date);
  if (!d) return "--";
  return `${formatDate(d)}, ${formatTime(d)}`;
}

export function formatTimeWithDay(date: Date | string | number, dayOffset?: string): string {
  const timeStr = formatTime(date);
  return dayOffset ? `${timeStr} (${dayOffset})` : timeStr;
}

// ─── Duration ──────────────────────────────────────────────────────

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// ─── Relative Time ─────────────────────────────────────────────────

import { getNow } from "@/lib/clock";

export function formatRelativeTime(date: Date | string | number): string {
  const d = toValidDate(date);
  if (!d) return "--";
  const now = getNow();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(d);
}

// ─── Helpers ───────────────────────────────────────────────────────

/**
 * Create a date relative to today using getNow().
 * daysOffset: 0 = today, 1 = tomorrow, -1 = yesterday
 * hour/minute set the time of day.
 */
export function relativeDate(
  daysOffset: number,
  hour: number,
  minute: number
): Date {
  const d = new Date(getNow().getTime());
  d.setDate(d.getDate() + daysOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
}

export function durationBetween(dep: Date, arr: Date): number {
  return Math.round((arr.getTime() - dep.getTime()) / 60000);
}
