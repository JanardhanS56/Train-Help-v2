/**
 * lib/data/adapters.ts
 * Type conversion adapters between Supabase database models and UI models.
 */

import type { DbTrip, DbDisruption } from "./types";
import type { Trip, TripStatus, TravelClass, Notification } from "@/lib/types";

export function dbTripToAppTrip(
  dbTrip: DbTrip,
  fromStationName?: string,
  toStationName?: string,
  trainName?: string
): Trip {
  const statusMap: Record<string, TripStatus> = {
    CONFIRMED: "on-time",
    DELAYED: "delayed",
    CANCELLED: "cancelled",
    REBOOKED: "recovered",
    COMPLETED: "on-time",
  };

  const status: TripStatus = statusMap[dbTrip.status] || "on-time";
  const departureDate = new Date(dbTrip.departure_time);
  const arrivalDate = new Date(dbTrip.arrival_time);

  return {
    id: dbTrip.id,
    pnr: dbTrip.pnr || "4281920194",
    passengerName: dbTrip.passenger_name || "Passenger",
    travelClass: (dbTrip.seat_info?.class || "3A") as TravelClass,
    fare: 1450,
    coach: dbTrip.seat_info?.coach || "B1",
    berth: dbTrip.seat_info?.berth || "32",
    status,
    disruptionReason:
      status === "cancelled"
        ? "Train cancelled due to emergency track maintenance."
        : status === "delayed"
        ? "Train running behind schedule."
        : undefined,
    segments: [
      {
        trainName: trainName || `Express ${dbTrip.train_number}`,
        trainNumber: dbTrip.train_number,
        departureStation: {
          code: dbTrip.from_station_code,
          name: fromStationName || dbTrip.from_station_code,
          city: fromStationName || dbTrip.from_station_code,
          platform: "Platform 1",
        },
        arrivalStation: {
          code: dbTrip.to_station_code,
          name: toStationName || dbTrip.to_station_code,
          city: toStationName || dbTrip.to_station_code,
          platform: "Platform 2",
        },
        departureTime: isNaN(departureDate.getTime()) ? new Date() : departureDate,
        arrivalTime: isNaN(arrivalDate.getTime()) ? new Date(Date.now() + 3600000 * 4) : arrivalDate,
        status,
        travelClass: (dbTrip.seat_info?.class || "3A") as TravelClass,
        coach: dbTrip.seat_info?.coach || "B1",
        berth: dbTrip.seat_info?.berth || "32",
        platform: "Platform 1",
      },
    ],
  };
}

export function dbDisruptionToNotification(
  disruption: DbDisruption,
  tripId?: string
): Notification {
  return {
    id: disruption.id,
    tripId: disruption.trip_id || tripId || "trip-default",
    type: disruption.type.toLowerCase().includes("cancel") ? "disruption" : "update",
    title: disruption.type.replace(/_/g, " "),
    message: disruption.description,
    timestamp: new Date(disruption.started_at),
    read: false,
  };
}
