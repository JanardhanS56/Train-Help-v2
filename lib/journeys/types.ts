/**
 * lib/journeys/types.ts
 * Type definitions for route- and date-aware journey search.
 */

import type { DbTrainStop } from "@/lib/data/types";

export type TravelClass = "1A" | "2A" | "3A" | "3E" | "EC" | "CC" | "SL" | "2S";

export interface SeatAvailability {
  status: "AVAILABLE" | "RAC" | "WL";
  count: number;
  badge: string; // e.g. "AVAILABLE 42" | "RAC 8" | "WL 14"
  isWaitlist: boolean;
  source: "Estimated";
}

export interface JourneyClassOption {
  travelClass: TravelClass;
  fare: number;
  fareSource: "Estimated";
  availability: SeatAvailability;
}

export interface StopTimeResolution {
  stop: DbTrainStop;
  arrivalDate: Date | null;
  departureDate: Date | null;
  arrivalFormatted: string | null;
  departureFormatted: string | null;
  dayOffset: number;
  dayLabel: string; // e.g. "+1 day", "+2 days", or ""
}

export interface JourneyLeg {
  trainNumber: string;
  trainName: string;
  trainType: string;
  fromStationCode: string;
  fromStationName: string;
  toStationCode: string;
  toStationName: string;
  fromSeq: number;
  toSeq: number;
  distanceKm: number;
  durationMin: number;
  departureTime: Date;
  arrivalTime: Date;
  departureFormatted: string; // "HH:mm"
  arrivalFormatted: string; // "HH:mm"
  arrivalDayLabel: string; // "" | "+1 day" | "+2 days"
  classes: JourneyClassOption[];
  originDate: Date; // Departure date from train's first station
  boardingDate: Date; // Date passenger boards this train
  platform: string; // "Platform TBA"
}

export interface JourneyItinerary {
  id: string; // e.g. "direct-22691-SBC-NDLS" or "conn-12028-12621-MAS"
  isConnecting: boolean;
  changes: number; // 0 for direct, 1 for connecting
  interchangeStation?: string;
  interchangeStationName?: string;
  layoverMin?: number;
  legs: JourneyLeg[];
  fromStationCode: string;
  fromStationName: string;
  toStationCode: string;
  toStationName: string;
  departureTime: Date;
  arrivalTime: Date;
  departureFormatted: string;
  arrivalFormatted: string;
  arrivalDayLabel: string;
  totalDurationMin: number;
  totalDistanceKm: number;
  classes: JourneyClassOption[];
}

export interface DirectJourneyQuery {
  fromCodes: string[];
  toCodes: string[];
  date: string | Date; // YYYY-MM-DD or Date
  now?: Date;
  bufferMinutes?: number;
}

export interface ConnectingJourneyQuery extends DirectJourneyQuery {
  maxChanges?: number; // default 1
  minLayoverMin?: number; // default 30
  maxLayoverMin?: number; // default 360
}

export interface JourneySearchResult {
  direct: JourneyItinerary[];
  connecting: JourneyItinerary[];
  searchedFromCodes: string[];
  searchedToCodes: string[];
  searchedDate: string;
  hasNearbyAlternatives: boolean;
}
