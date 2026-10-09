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

export function formatTime(date: Date): string {
  return timeFormatter.format(date);
}

export function formatDate(date: Date): string {
  return dateFormatter.format(date);
}

export function formatFullDate(date: Date): string {
  return fullDateFormatter.format(date);
}

export function formatDateTime(date: Date): string {
  return `${formatDate(date)}, ${formatTime(date)}`;
}

export function formatTimeWithDay(date: Date, dayOffset?: string): string {
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

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

// ─── Helpers ───────────────────────────────────────────────────────

/**
 * Create a date relative to today.
 * daysOffset: 0 = today, 1 = tomorrow, -1 = yesterday
 * hour/minute set the time of day.
 */
export function relativeDate(
  daysOffset: number,
  hour: number,
  minute: number
): Date {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
}

export function durationBetween(dep: Date, arr: Date): number {
  return Math.round((arr.getTime() - dep.getTime()) / 60000);
}
