export type SeatStatus =
  | { type: "CNF" }
  | { type: "RAC"; n: number }
  | { type: "WL"; n: number };

export interface SampleTrain {
  id: string;
  name: string;
  number: string;
  dep: string;
  arr: string;
  arrDayOffset: number;
  fare: number;
  seat: SeatStatus;
}

export const SAMPLE_TRAINS: SampleTrain[] = [
  {
    id: "a",
    name: "Sample Rajdhani",
    number: "22691",
    dep: "20:00",
    arr: "05:30",
    arrDayOffset: 2,
    fare: 3150,
    seat: { type: "CNF" },
  },
  {
    id: "b",
    name: "Sample Sampark Kranti",
    number: "12649",
    dep: "16:30",
    arr: "09:15",
    arrDayOffset: 2,
    fare: 1780,
    seat: { type: "RAC", n: 2 },
  },
  {
    id: "c",
    name: "Sample Express",
    number: "12627",
    dep: "21:15",
    arr: "11:40",
    arrDayOffset: 2,
    fare: 1420,
    seat: { type: "WL", n: 4 },
  },
];

function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [h, m] = timeStr.split(":").map((v) => parseInt(v, 10));
  return { hours: h ?? 0, minutes: m ?? 0 };
}

/**
 * Pure function: derives total duration in minutes from departure, arrival, and day offset.
 */
export function deriveDurationMinutes(
  dep: string,
  arr: string,
  arrDayOffset: number
): number {
  const depTime = parseTime(dep);
  const arrTime = parseTime(arr);

  const depMinutes = depTime.hours * 60 + depTime.minutes;
  const arrMinutes =
    arrDayOffset * 24 * 60 + (arrTime.hours * 60 + arrTime.minutes);

  return Math.max(0, arrMinutes - depMinutes);
}

/**
 * Pure function: formats duration into readable string (e.g., "33h 30m").
 */
export function deriveDurationString(
  dep: string,
  arr: string,
  arrDayOffset: number
): string {
  const total = deriveDurationMinutes(dep, arr, arrDayOffset);
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/**
 * Calculates absolute arrival time from departure day start (in minutes) for sorting.
 */
export function getAbsoluteArrivalMinutes(
  arr: string,
  arrDayOffset: number
): number {
  const arrTime = parseTime(arr);
  return arrDayOffset * 24 * 60 + (arrTime.hours * 60 + arrTime.minutes);
}

function getSeatPriority(seat: SeatStatus): number {
  if (seat.type === "CNF") return 0;
  if (seat.type === "RAC") return 1;
  return 2; // WL
}

export function formatSeatLabel(seat: SeatStatus): string {
  if (seat.type === "CNF") return "CNF (Confirmed)";
  if (seat.type === "RAC") return `RAC ${seat.n}`;
  return `WL ${seat.n}`;
}

export interface RankedTrainItem {
  train: SampleTrain;
  isEligible: boolean;
  durationString: string;
  explanation: string;
}

export interface RankResult {
  eligible: RankedTrainItem[];
  ineligible: RankedTrainItem[];
  all: RankedTrainItem[];
  best: RankedTrainItem | null;
}

export function generateTrainExplanation(
  train: SampleTrain,
  isEligible: boolean,
  isBest: boolean
): string {
  if (!isEligible) {
    return "Exceeds current budget threshold";
  }
  const seatDesc =
    train.seat.type === "CNF"
      ? "Confirmed berth"
      : train.seat.type === "RAC"
      ? `RAC ${train.seat.n} allocation`
      : `WL ${train.seat.n} waitlist`;

  if (isBest) {
    return `${seatDesc}, earliest available arrival, within budget`;
  }
  return `${seatDesc}, alternate schedule within budget`;
}

/**
 * Shared comparator rankTrains(trains, budget):
 * eligible = fare <= budget;
 * sort eligible by seat class (CNF < RAC < WL), then earlier arrival, then lower fare;
 * ineligible trains are listed after, marked "Over budget".
 * Best = first eligible or null.
 */
export function rankTrains(
  trains: SampleTrain[],
  budget: number
): RankResult {
  const eligibleTrains: SampleTrain[] = [];
  const ineligibleTrains: SampleTrain[] = [];

  for (const train of trains) {
    if (train.fare <= budget) {
      eligibleTrains.push(train);
    } else {
      ineligibleTrains.push(train);
    }
  }

  eligibleTrains.sort((a, b) => {
    // 1. Seat class (CNF < RAC < WL)
    const seatDiff = getSeatPriority(a.seat) - getSeatPriority(b.seat);
    if (seatDiff !== 0) return seatDiff;

    // 2. Earlier arrival
    const arrA = getAbsoluteArrivalMinutes(a.arr, a.arrDayOffset);
    const arrB = getAbsoluteArrivalMinutes(b.arr, b.arrDayOffset);
    if (arrA !== arrB) return arrA - arrB;

    // 3. Lower fare
    return a.fare - b.fare;
  });

  ineligibleTrains.sort((a, b) => a.fare - b.fare);

  const eligibleItems: RankedTrainItem[] = eligibleTrains.map((t, idx) => ({
    train: t,
    isEligible: true,
    durationString: deriveDurationString(t.dep, t.arr, t.arrDayOffset),
    explanation: generateTrainExplanation(t, true, idx === 0),
  }));

  const ineligibleItems: RankedTrainItem[] = ineligibleTrains.map((t) => ({
    train: t,
    isEligible: false,
    durationString: deriveDurationString(t.dep, t.arr, t.arrDayOffset),
    explanation: generateTrainExplanation(t, false, false),
  }));

  const bestItem = eligibleItems[0] ?? null;

  return {
    eligible: eligibleItems,
    ineligible: ineligibleItems,
    all: [...eligibleItems, ...ineligibleItems],
    best: bestItem,
  };
}
