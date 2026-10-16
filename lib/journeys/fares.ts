/**
 * lib/journeys/fares.ts
 * Indian Railways Distance-Slab Fare Estimation Engine.
 *
 * Source: Ministry of Railways, Government of India / IRCTC Passenger Fare Structure
 * Commercial Circular Revision Guidelines (documented October 2026 in docs/fare-model.md).
 * All returned values represent estimated fares labelled "Estimated".
 */

import type { TravelClass } from "./types";

interface ClassFareConfig {
  baseRatePerKm: number;
  minDistanceKm: number;
  minBaseFare: number;
  reservationFee: number;
  superfastCharge: number;
  hasGst: boolean;
}

const FARE_CONFIG: Record<TravelClass, ClassFareConfig> = {
  "1A": {
    baseRatePerKm: 3.05,
    minDistanceKm: 300,
    minBaseFare: 1295,
    reservationFee: 60,
    superfastCharge: 75,
    hasGst: true,
  },
  "2A": {
    baseRatePerKm: 1.80,
    minDistanceKm: 300,
    minBaseFare: 755,
    reservationFee: 50,
    superfastCharge: 45,
    hasGst: true,
  },
  "3A": {
    baseRatePerKm: 1.25,
    minDistanceKm: 300,
    minBaseFare: 495,
    reservationFee: 40,
    superfastCharge: 45,
    hasGst: true,
  },
  "3E": {
    baseRatePerKm: 1.15,
    minDistanceKm: 300,
    minBaseFare: 455,
    reservationFee: 40,
    superfastCharge: 45,
    hasGst: true,
  },
  EC: {
    baseRatePerKm: 2.35,
    minDistanceKm: 150,
    minBaseFare: 850,
    reservationFee: 60,
    superfastCharge: 75,
    hasGst: true,
  },
  CC: {
    baseRatePerKm: 1.15,
    minDistanceKm: 150,
    minBaseFare: 280,
    reservationFee: 40,
    superfastCharge: 45,
    hasGst: true,
  },
  SL: {
    baseRatePerKm: 0.48,
    minDistanceKm: 200,
    minBaseFare: 145,
    reservationFee: 20,
    superfastCharge: 30,
    hasGst: false,
  },
  "2S": {
    baseRatePerKm: 0.28,
    minDistanceKm: 50,
    minBaseFare: 60,
    reservationFee: 15,
    superfastCharge: 15,
    hasGst: false,
  },
};

/**
 * Rounds a number UP to the next multiple of 5 according to Indian Railways rounding rules.
 */
function roundToNext5(val: number): number {
  return Math.ceil(val / 5) * 5;
}

/**
 * Calculates estimated Indian Railways fare for a given distance, travel class, and train type.
 */
export function estimateFare(
  distanceKm: number,
  travelClass: TravelClass,
  trainType = "Superfast"
): number {
  const config = FARE_CONFIG[travelClass] || FARE_CONFIG["3A"];
  const safeDistance = Math.max(distanceKm, 1);
  const effectiveDistance = Math.max(safeDistance, config.minDistanceKm);

  // Telescopic distance slab discount for long haul journeys (> 500 km)
  let rawBaseFare = 0;
  if (effectiveDistance <= 500) {
    rawBaseFare = effectiveDistance * config.baseRatePerKm;
  } else if (effectiveDistance <= 1200) {
    rawBaseFare = 500 * config.baseRatePerKm + (effectiveDistance - 500) * config.baseRatePerKm * 0.90;
  } else {
    rawBaseFare =
      500 * config.baseRatePerKm +
      700 * config.baseRatePerKm * 0.90 +
      (effectiveDistance - 1200) * config.baseRatePerKm * 0.82;
  }

  rawBaseFare = Math.max(rawBaseFare, config.minBaseFare);

  const typeLower = (trainType || "").toLowerCase();
  let trainMultiplier = 1.0;
  let cateringFee = 0;
  let isSuperfast = typeLower.includes("superfast") || typeLower.includes("sf");

  if (typeLower.includes("rajdhani") || typeLower.includes("tejas")) {
    trainMultiplier = 1.10;
    isSuperfast = true;
    cateringFee = travelClass === "1A" ? 375 : travelClass === "2A" ? 295 : 285;
  } else if (typeLower.includes("shatabdi") || typeLower.includes("vande bharat")) {
    trainMultiplier = 1.08;
    isSuperfast = true;
    cateringFee = travelClass === "EC" ? 245 : 185;
  } else if (typeLower.includes("duronto")) {
    trainMultiplier = 1.05;
    isSuperfast = true;
    cateringFee = travelClass === "SL" ? 120 : 260;
  } else if (typeLower.includes("garib rath")) {
    trainMultiplier = 0.85;
    isSuperfast = true;
  }

  const baseFareWithTrain = rawBaseFare * trainMultiplier;
  const superfastCharge = isSuperfast ? config.superfastCharge : 0;
  const subtotal = baseFareWithTrain + config.reservationFee + superfastCharge + cateringFee;

  const gst = config.hasGst ? subtotal * 0.05 : 0;
  const total = subtotal + gst;

  return roundToNext5(total);
}
