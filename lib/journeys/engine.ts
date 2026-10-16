/**
 * lib/journeys/engine.ts
 * Core Route- and Date-Aware Journey Search Engine.
 *
 * Enforces:
 * 1. Strict sequence ordering: stop_from.seq < stop_to.seq.
 * 2. Origin-day running calculation taking stop day_offset into account.
 * 3. Departure time cutoff for same-day searches against current clock (with configurable buffer).
 * 4. 1-change connecting journeys when direct trains are absent or for recovery.
 * 5. Deterministic fare and seat availability calculations.
 */

import type { TrainWithStops, DbTrainStop } from "@/lib/data/types";
import { getTrainDataset } from "./data-provider";
import { classesOffered } from "./classes";
import { estimateFare } from "./fares";
import { estimateAvailability } from "./availability";
import { expandNearby } from "./stations";
import {
  parseISTDate,
  formatISTTime,
  formatISTDate,
  runsOnBoardingDate,
  getTodayIST,
} from "./time";
import type {
  JourneyItinerary,
  JourneyLeg,
  JourneyClassOption,
  DirectJourneyQuery,
  ConnectingJourneyQuery,
  JourneySearchResult,
} from "./types";

/**
 * Searches for direct trains serving any origin code to any destination code on the chosen date.
 */
export async function findDirectJourneys(
  query: DirectJourneyQuery,
  customDataset?: Map<string, TrainWithStops>
): Promise<JourneyItinerary[]> {
  const trainMap = customDataset || (await getTrainDataset());
  const fromCodesSet = new Set(query.fromCodes.map((c) => c.trim().toUpperCase()));
  const toCodesSet = new Set(query.toCodes.map((c) => c.trim().toUpperCase()));

  const dateStr =
    typeof query.date === "string" ? query.date : formatISTDate(query.date);
  const boardingDate = parseISTDate(dateStr);
  const now = query.now || new Date();
  const todayIST = getTodayIST(now);
  const isToday = dateStr === todayIST;

  const bufferMs = (query.bufferMinutes ?? 15) * 60_000;
  const cutoffTimeMs = now.getTime() + bufferMs;

  const itineraries: JourneyItinerary[] = [];

  for (const train of trainMap.values()) {
    const stops = train.stops;
    if (!stops || stops.length < 2) continue;

    // Find all matching From stops
    for (let i = 0; i < stops.length; i++) {
      const fromStop = stops[i];
      if (!fromCodesSet.has(fromStop.station_code)) continue;

      // Check if train runs on this boarding date at this stop
      if (!runsOnBoardingDate(train, fromStop, boardingDate)) continue;

      // Find all subsequent matching To stops (from.seq < to.seq)
      for (let j = i + 1; j < stops.length; j++) {
        const toStop = stops[j];
        if (!toCodesSet.has(toStop.station_code)) continue;

        // Calculate real timestamps using origin date shift
        const originMidnightMs = boardingDate.getTime() - (fromStop.day_offset || 0) * 86_400_000;
        const depTimeMs = originMidnightMs + (fromStop.departure_min ?? 0) * 60_000;
        const arrTimeMs = originMidnightMs + (toStop.arrival_min ?? 0) * 60_000;

        // If today, filter out trains that have already departed
        if (isToday && depTimeMs <= cutoffTimeMs) {
          continue;
        }

        const departureTime = new Date(depTimeMs);
        const arrivalTime = new Date(arrTimeMs);

        const durationMin = Math.max(1, Math.round((arrTimeMs - depTimeMs) / 60_000));
        const distanceKm = Math.max(1, Math.round(toStop.distance_km - fromStop.distance_km));

        const arrivalDayDiff = Math.max(
          0,
          (toStop.day_offset ?? 0) - (fromStop.day_offset ?? 0)
        );
        const arrivalDayLabel =
          arrivalDayDiff > 0 ? `+${arrivalDayDiff} day${arrivalDayDiff > 1 ? "s" : ""}` : "";

        // Build class options
        const { classes: offeredClasses } = classesOffered(train);
        const classOptions: JourneyClassOption[] = offeredClasses.map((travelClass) => ({
          travelClass,
          fare: estimateFare(distanceKm, travelClass, train.train_type),
          fareSource: "Estimated",
          availability: estimateAvailability(train.train_number, dateStr, travelClass),
        }));

        const leg: JourneyLeg = {
          trainNumber: train.train_number,
          trainName: train.train_name,
          trainType: train.train_type,
          fromStationCode: fromStop.station_code,
          fromStationName: fromStop.station_name,
          toStationCode: toStop.station_code,
          toStationName: toStop.station_name,
          fromSeq: fromStop.seq,
          toSeq: toStop.seq,
          distanceKm,
          durationMin,
          departureTime,
          arrivalTime,
          departureFormatted: formatISTTime(departureTime),
          arrivalFormatted: formatISTTime(arrivalTime),
          arrivalDayLabel,
          classes: classOptions,
          originDate: new Date(originMidnightMs),
          boardingDate,
          platform: "Platform TBA",
        };

        itineraries.push({
          id: `direct-${train.train_number}-${fromStop.station_code}-${toStop.station_code}`,
          isConnecting: false,
          changes: 0,
          legs: [leg],
          fromStationCode: fromStop.station_code,
          fromStationName: fromStop.station_name,
          toStationCode: toStop.station_code,
          toStationName: toStop.station_name,
          departureTime,
          arrivalTime,
          departureFormatted: formatISTTime(departureTime),
          arrivalFormatted: formatISTTime(arrivalTime),
          arrivalDayLabel,
          totalDurationMin: durationMin,
          totalDistanceKm: distanceKm,
          classes: classOptions,
        });
      }
    }
  }

  // Sort by departure time ascending
  itineraries.sort((a, b) => a.departureTime.getTime() - b.departureTime.getTime());
  return itineraries;
}

/**
 * Searches for 1-change connecting journeys between origin and destination via common junctions.
 */
export async function findConnectingJourneys(
  query: ConnectingJourneyQuery,
  customDataset?: Map<string, TrainWithStops>
): Promise<JourneyItinerary[]> {
  const trainMap = customDataset || (await getTrainDataset());
  const fromCodesSet = new Set(query.fromCodes.map((c) => c.trim().toUpperCase()));
  const toCodesSet = new Set(query.toCodes.map((c) => c.trim().toUpperCase()));

  const dateStr =
    typeof query.date === "string" ? query.date : formatISTDate(query.date);
  const boardingDate = parseISTDate(dateStr);
  const minLayoverMs = (query.minLayoverMin ?? 35) * 60_000;
  const maxLayoverMs = (query.maxLayoverMin ?? 360) * 60_000;

  const now = query.now || new Date();
  const bufferMs = (query.bufferMinutes ?? 15) * 60_000;
  const cutoffTimeMs = now.getTime() + bufferMs;
  const isToday = dateStr === getTodayIST();

  // Find all possible Leg 1 trains originating from fromCodes
  const leg1Candidates: Array<{
    train: TrainWithStops;
    fromStop: DbTrainStop;
    interchangeStop: DbTrainStop;
    departureTime: Date;
    arrivalTime: Date;
  }> = [];

  for (const train of trainMap.values()) {
    const stops = train.stops;
    if (!stops || stops.length < 2) continue;

    for (let i = 0; i < stops.length; i++) {
      const fromStop = stops[i];
      if (!fromCodesSet.has(fromStop.station_code)) continue;
      if (!runsOnBoardingDate(train, fromStop, boardingDate)) continue;

      const originMidnightMs = boardingDate.getTime() - (fromStop.day_offset || 0) * 86_400_000;
      const depTimeMs = originMidnightMs + (fromStop.departure_min ?? 0) * 60_000;

      if (isToday && depTimeMs <= cutoffTimeMs) continue;

      for (let j = i + 1; j < stops.length; j++) {
        const interchangeStop = stops[j];
        // Cannot be a direct destination (direct journeys handle that)
        if (toCodesSet.has(interchangeStop.station_code)) continue;

        const arrTimeMs = originMidnightMs + (interchangeStop.arrival_min ?? 0) * 60_000;
        leg1Candidates.push({
          train,
          fromStop,
          interchangeStop,
          departureTime: new Date(depTimeMs),
          arrivalTime: new Date(arrTimeMs),
        });
      }
    }
  }

  const connectingItineraries: JourneyItinerary[] = [];

  // Match with Leg 2 trains
  for (const leg1 of leg1Candidates) {
    const junctionCode = leg1.interchangeStop.station_code;
    const leg1ArrMs = leg1.arrivalTime.getTime();

    for (const train2 of trainMap.values()) {
      if (train2.train_number === leg1.train.train_number) continue; // Different train required

      const stops2 = train2.stops;
      if (!stops2 || stops2.length < 2) continue;

      for (let i2 = 0; i2 < stops2.length; i2++) {
        const junctionStop2 = stops2[i2];
        if (junctionStop2.station_code !== junctionCode) continue;

        // Check running on date leg1 arrives
        const leg2BoardingDate = parseISTDate(formatISTDate(leg1.arrivalTime));
        if (!runsOnBoardingDate(train2, junctionStop2, leg2BoardingDate)) continue;

        const leg2OriginMidnightMs =
          leg2BoardingDate.getTime() - (junctionStop2.day_offset || 0) * 86_400_000;
        const leg2DepMs = leg2OriginMidnightMs + (junctionStop2.departure_min ?? 0) * 60_000;

        const layoverMs = leg2DepMs - leg1ArrMs;
        if (layoverMs < minLayoverMs || layoverMs > maxLayoverMs) continue;

        for (let j2 = i2 + 1; j2 < stops2.length; j2++) {
          const toStop2 = stops2[j2];
          if (!toCodesSet.has(toStop2.station_code)) continue;

          const leg2ArrMs = leg2OriginMidnightMs + (toStop2.arrival_min ?? 0) * 60_000;
          const leg2DepTime = new Date(leg2DepMs);
          const leg2ArrTime = new Date(leg2ArrMs);

          const leg1Dist = Math.max(1, Math.round(leg1.interchangeStop.distance_km - leg1.fromStop.distance_km));
          const leg2Dist = Math.max(1, Math.round(toStop2.distance_km - junctionStop2.distance_km));
          const totalDistanceKm = leg1Dist + leg2Dist;

          const leg1Dur = Math.max(1, Math.round((leg1ArrMs - leg1.departureTime.getTime()) / 60_000));
          const leg2Dur = Math.max(1, Math.round((leg2ArrMs - leg2DepMs) / 60_000));
          const totalDurationMin = Math.round((leg2ArrMs - leg1.departureTime.getTime()) / 60_000);
          const layoverMin = Math.round(layoverMs / 60_000);

          // Build class options (intersection of classes or 3A/SL default)
          const { classes: c1 } = classesOffered(leg1.train);
          const { classes: c2 } = classesOffered(train2);
          const commonClasses = c1.filter((c) => c2.includes(c));
          const classesToOffer = commonClasses.length > 0 ? commonClasses : (["3A", "SL"] as const);

          const classOptions: JourneyClassOption[] = classesToOffer.map((tc) => {
            const fare1 = estimateFare(leg1Dist, tc, leg1.train.train_type);
            const fare2 = estimateFare(leg2Dist, tc, train2.train_type);
            return {
              travelClass: tc,
              fare: fare1 + fare2,
              fareSource: "Estimated",
              availability: estimateAvailability(train2.train_number, dateStr, tc),
            };
          });

          const leg1Obj: JourneyLeg = {
            trainNumber: leg1.train.train_number,
            trainName: leg1.train.train_name,
            trainType: leg1.train.train_type,
            fromStationCode: leg1.fromStop.station_code,
            fromStationName: leg1.fromStop.station_name,
            toStationCode: leg1.interchangeStop.station_code,
            toStationName: leg1.interchangeStop.station_name,
            fromSeq: leg1.fromStop.seq,
            toSeq: leg1.interchangeStop.seq,
            distanceKm: leg1Dist,
            durationMin: leg1Dur,
            departureTime: leg1.departureTime,
            arrivalTime: leg1.arrivalTime,
            departureFormatted: formatISTTime(leg1.departureTime),
            arrivalFormatted: formatISTTime(leg1.arrivalTime),
            arrivalDayLabel: "",
            classes: classOptions,
            originDate: parseISTDate(dateStr),
            boardingDate,
            platform: "Platform TBA",
          };

          const leg2Obj: JourneyLeg = {
            trainNumber: train2.train_number,
            trainName: train2.train_name,
            trainType: train2.train_type,
            fromStationCode: junctionStop2.station_code,
            fromStationName: junctionStop2.station_name,
            toStationCode: toStop2.station_code,
            toStationName: toStop2.station_name,
            fromSeq: junctionStop2.seq,
            toSeq: toStop2.seq,
            distanceKm: leg2Dist,
            durationMin: leg2Dur,
            departureTime: leg2DepTime,
            arrivalTime: leg2ArrTime,
            departureFormatted: formatISTTime(leg2DepTime),
            arrivalFormatted: formatISTTime(leg2ArrTime),
            arrivalDayLabel: "",
            classes: classOptions,
            originDate: leg2BoardingDate,
            boardingDate: leg2BoardingDate,
            platform: "Platform TBA",
          };

          const depDateStr = formatISTDate(leg1.departureTime);
          const arrDateStr = formatISTDate(leg2ArrTime);
          const arrivalDayDiff = Math.max(
            0,
            Math.round(
              (parseISTDate(arrDateStr).getTime() - parseISTDate(depDateStr).getTime()) /
                86_400_000
            )
          );
          const arrivalDayLabel =
            arrivalDayDiff > 0 ? `+${arrivalDayDiff} day${arrivalDayDiff > 1 ? "s" : ""}` : "";

          connectingItineraries.push({
            id: `conn-${leg1.train.train_number}-${train2.train_number}-${junctionCode}`,
            isConnecting: true,
            changes: 1,
            interchangeStation: junctionCode,
            interchangeStationName: leg1.interchangeStop.station_name,
            layoverMin,
            legs: [leg1Obj, leg2Obj],
            fromStationCode: leg1.fromStop.station_code,
            fromStationName: leg1.fromStop.station_name,
            toStationCode: toStop2.station_code,
            toStationName: toStop2.station_name,
            departureTime: leg1.departureTime,
            arrivalTime: leg2ArrTime,
            departureFormatted: formatISTTime(leg1.departureTime),
            arrivalFormatted: formatISTTime(leg2ArrTime),
            arrivalDayLabel,
            totalDurationMin,
            totalDistanceKm,
            classes: classOptions,
          });

          // Limit to max 10 connecting journeys to preserve performance
          if (connectingItineraries.length >= 10) break;
        }
      }
    }
    if (connectingItineraries.length >= 10) break;
  }

  connectingItineraries.sort((a, b) => a.totalDurationMin - b.totalDurationMin);
  return connectingItineraries;
}

/**
 * Universal journey search: direct journeys + optional connecting journeys + nearby expansion.
 */
export async function searchJourneys(options: {
  fromCode: string;
  toCode: string;
  date: string | Date;
  includeNearby?: boolean;
  now?: Date;
  minLayoverMin?: number;
  maxLayoverMin?: number;
}): Promise<JourneySearchResult> {
  const fromCode = (options.fromCode || "").trim().toUpperCase();
  const toCode = (options.toCode || "").trim().toUpperCase();
  const dateStr =
    typeof options.date === "string" ? options.date : formatISTDate(options.date);

  const fromCodes = options.includeNearby ? expandNearby(fromCode) : [fromCode];
  const toCodes = options.includeNearby ? expandNearby(toCode) : [toCode];

  const direct = await findDirectJourneys({
    fromCodes,
    toCodes,
    date: dateStr,
    now: options.now,
  });

  let connecting: JourneyItinerary[] = [];
  // Look for connecting journeys if direct trains are scarce (<= 2)
  if (direct.length <= 2) {
    connecting = await findConnectingJourneys({
      fromCodes,
      toCodes,
      date: dateStr,
      now: options.now,
      minLayoverMin: options.minLayoverMin,
      maxLayoverMin: options.maxLayoverMin,
    });
  }

  const hasNearbyAlternatives =
    (fromCodes.length > 1 || toCodes.length > 1) &&
    direct.some(
      (j) => j.fromStationCode !== fromCode || j.toStationCode !== toCode
    );

  return {
    direct,
    connecting,
    searchedFromCodes: fromCodes,
    searchedToCodes: toCodes,
    searchedDate: dateStr,
    hasNearbyAlternatives,
  };
}
