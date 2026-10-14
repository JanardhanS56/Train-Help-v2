import { TravelClass, BookingQuota, BookingPassenger, Trip } from "@/lib/types";

export interface FareCalculation {
  baseFarePerPassenger: number;
  passengerCount: number;
  totalBaseFare: number;
  reservationCharge: number;
  superfastCharge: number;
  tatkalCharge: number;
  gstAmount: number;
  totalFare: number;
}

export const CLASS_BASE_FARES: Record<TravelClass, number> = {
  "1A": 3250,
  "2A": 2150,
  "3A": 1520,
  "CC": 950,
  "SL": 520,
  "EC": 1850,
};

export const CLASS_RESERVATION_CHARGES: Record<TravelClass, number> = {
  "1A": 60,
  "2A": 50,
  "3A": 40,
  "CC": 40,
  "SL": 20,
  "EC": 60,
};

export const TATKAL_SURCHARGES: Record<TravelClass, number> = {
  "1A": 500,
  "2A": 400,
  "3A": 300,
  "CC": 225,
  "SL": 100,
  "EC": 400,
};

export function calculateFareBreakdown(
  travelClass: TravelClass,
  quota: BookingQuota,
  passengers: BookingPassenger[]
): FareCalculation {
  const count = Math.max(1, passengers.length);
  const basePer = CLASS_BASE_FARES[travelClass] || 1500;
  const resPer = CLASS_RESERVATION_CHARGES[travelClass] || 40;
  const tatkalPer = quota === "TQ" ? (TATKAL_SURCHARGES[travelClass] || 300) : 0;
  const sfPer = travelClass === "SL" ? 30 : 45;

  const totalBaseFare = basePer * count;
  const reservationCharge = resPer * count;
  const superfastCharge = sfPer * count;
  const tatkalCharge = tatkalPer * count;

  // 5% GST on AC classes, 0% on Sleeper
  const isAc = travelClass !== "SL";
  const taxableSum = totalBaseFare + reservationCharge + superfastCharge + tatkalCharge;
  const gstAmount = isAc ? Math.round(taxableSum * 0.05) : 0;

  const totalFare = taxableSum + gstAmount;

  return {
    baseFarePerPassenger: basePer,
    passengerCount: count,
    totalBaseFare,
    reservationCharge,
    superfastCharge,
    tatkalCharge,
    gstAmount,
    totalFare,
  };
}

/**
 * Generate a realistic 10-digit Indian Railways PNR
 * Structure: 3-digit PRSO code (e.g. 245, 412, 638) + 7 random digits
 */
export function generatePNR(): string {
  const zonePrefixes = ["241", "452", "638", "824", "193"];
  const prefix = zonePrefixes[Math.floor(Math.random() * zonePrefixes.length)];
  const suffix = Math.floor(1000000 + Math.random() * 9000000).toString();
  return `${prefix}${suffix}`;
}

export function assignBerths(
  travelClass: TravelClass,
  passengers: BookingPassenger[]
): { coach: string; berths: string[]; status: "CONFIRMED" | "RAC" | "WL" } {
  const coachPrefix =
    travelClass === "1A"
      ? "H"
      : travelClass === "2A"
      ? "A"
      : travelClass === "3A"
      ? "B"
      : travelClass === "CC"
      ? "C"
      : "S";

  const coachNum = Math.floor(Math.random() * 4) + 1;
  const coach = `${coachPrefix}${coachNum}`;

  const berths: string[] = [];
  const baseSeat = Math.floor(Math.random() * 40) + 1;

  for (let i = 0; i < passengers.length; i++) {
    const pref = passengers[i].berthPreference;
    let label = "Lower";
    if (pref === "UB") label = "Upper";
    else if (pref === "MB") label = "Middle";
    else if (pref === "SL") label = "Side Lower";
    else if (pref === "SU") label = "Side Upper";
    else if (pref === "WS") label = "Window";

    berths.push(`${baseSeat + i} (${label})`);
  }

  return {
    coach,
    berths,
    status: "CONFIRMED",
  };
}

const STORAGE_KEY = "tr_custom_bookings_v1";

export function saveBookingToStorage(trip: Trip): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const existing: Trip[] = raw ? JSON.parse(raw) : [];
    // Prepend to bookings
    localStorage.setItem(STORAGE_KEY, JSON.stringify([trip, ...existing]));
  } catch (err) {
    console.error("Failed to save booking to localStorage", err);
  }
}

export function loadBookingsFromStorage(): Trip[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: Trip[] = JSON.parse(raw);
    // Convert date strings back to Date objects
    return parsed.map((t) => ({
      ...t,
      segments: t.segments.map((s) => ({
        ...s,
        departureTime: new Date(s.departureTime),
        arrivalTime: new Date(s.arrivalTime),
      })),
      neededByTime: t.neededByTime ? new Date(t.neededByTime) : undefined,
    }));
  } catch (err) {
    console.error("Failed to load bookings from localStorage", err);
    return [];
  }
}
