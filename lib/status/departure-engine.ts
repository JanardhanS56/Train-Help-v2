export type TrainOperationalStatusCode =
  | "yet-to-arrive"
  | "boarding-soon"
  | "departed"
  | "completed";

export interface TrainOperationalStatus {
  code: TrainOperationalStatusCode;
  label: string;
  badgeClass: string;
  dotClass: string;
  detail: string;
  minutesToDeparture: number;
  minutesToArrival: number;
}

/**
 * Pure utility function to classify the real-time operational status of a train.
 * Compares current system timestamp against scheduled departure & arrival timestamps.
 *
 * Rules:
 * - YET TO ARRIVE: departure time is > 30 minutes in the future
 * - BOARDING / ARRIVING SOON: within 30 minutes of departure (or just boarding)
 * - DEPARTED: passed departure time, before destination arrival
 * - COMPLETED / CLOSED: arrival time has elapsed
 */
export function classifyTrainOperationalStatus(
  scheduledDeparture: Date | string | number,
  scheduledArrival: Date | string | number,
  currentTime: Date | string | number = new Date()
): TrainOperationalStatus {
  const depMs = new Date(scheduledDeparture).getTime();
  const arrMs = new Date(scheduledArrival).getTime();
  const nowMs = new Date(currentTime).getTime();

  // Edge case safety: if arrival timestamp is recorded as earlier than departure on same day,
  // handle midnight crossover by treating arrival as next day (+24h)
  const adjustedArrMs = arrMs < depMs ? arrMs + 24 * 3600 * 1000 : arrMs;

  const msToDep = depMs - nowMs;
  const msToArr = adjustedArrMs - nowMs;
  const minToDep = Math.round(msToDep / 60000);
  const minToArr = Math.round(msToArr / 60000);

  // 1. COMPLETED / CLOSED
  if (nowMs >= adjustedArrMs) {
    return {
      code: "completed",
      label: "COMPLETED / CLOSED",
      badgeClass: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20",
      dotClass: "bg-slate-400",
      detail: "Arrived at destination",
      minutesToDeparture: minToDep,
      minutesToArrival: minToArr,
    };
  }

  // 2. DEPARTED
  if (nowMs >= depMs) {
    const elapsedMinutes = Math.abs(minToDep);
    const hrs = Math.floor(elapsedMinutes / 60);
    const mins = elapsedMinutes % 60;
    const elapsedText = hrs > 0 ? `${hrs}h ${mins}m ago` : `${mins}m ago`;

    return {
      code: "departed",
      label: "DEPARTED",
      badgeClass: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
      dotClass: "bg-blue-500 animate-pulse",
      detail: `En route (Departed ${elapsedText})`,
      minutesToDeparture: minToDep,
      minutesToArrival: minToArr,
    };
  }

  // 3. BOARDING / ARRIVING SOON (within 30 minutes of departure)
  if (minToDep <= 30 && minToDep >= 0) {
    return {
      code: "boarding-soon",
      label: "BOARDING / ARRIVING SOON",
      badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
      dotClass: "bg-amber-500 animate-ping",
      detail: `Platform boarding (Departs in ${minToDep}m)`,
      minutesToDeparture: minToDep,
      minutesToArrival: minToArr,
    };
  }

  // 4. YET TO ARRIVE (departure > 30 minutes in future)
  const days = Math.floor(minToDep / 1440);
  const hrs = Math.floor((minToDep % 1440) / 60);
  const remainingMins = minToDep % 60;
  let remainingText = "";
  if (days > 0) remainingText = `in ${days}d ${hrs}h`;
  else if (hrs > 0) remainingText = `in ${hrs}h ${remainingMins}m`;
  else remainingText = `in ${remainingMins}m`;

  return {
    code: "yet-to-arrive",
    label: "YET TO ARRIVE",
    badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    dotClass: "bg-emerald-500",
    detail: `On time (Departs ${remainingText})`,
    minutesToDeparture: minToDep,
    minutesToArrival: minToArr,
  };
}

/**
 * Format live date & time widget using native Intl.DateTimeFormat
 * Format: "Wed, 14 Oct | 09:17 PM"
 */
export function formatLiveTopBarDate(date: Date = new Date()): string {
  const weekdayMonthDay = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);

  const time = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);

  return `${weekdayMonthDay} | ${time}`;
}
