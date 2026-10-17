/**
 * lib/data/__tests__/data-layer.test.ts
 * Unit tests for Supabase data-access layer adapters and repository mappings.
 */

import { describe, it, expect } from "vitest";
import { dbTripToAppTrip, dbDisruptionToNotification } from "../adapters";
import type { DbTrip, DbDisruption } from "../types";

describe("Supabase Data Layer Adapters", () => {
  it("correctly converts confirmed DbTrip to UI Trip model", () => {
    const dbTrip: DbTrip = {
      id: "trip-uuid-1",
      passenger_id: "usr_test",
      passenger_name: "Test Passenger",
      train_number: "20608",
      from_station_code: "SBC",
      to_station_code: "MAS",
      status: "CONFIRMED",
      pnr: "4281920194",
      seat_info: {
        coach: "C2",
        berth: "42",
        class: "CC",
      },
      departure_time: "2026-10-16T06:00:00Z",
      arrival_time: "2026-10-16T10:25:00Z",
    };

    const trip = dbTripToAppTrip(dbTrip, "KSR Bengaluru", "Chennai Central", "Vande Bharat Express");

    expect(trip.id).toBe("trip-uuid-1");
    expect(trip.pnr).toBe("4281920194");
    expect(trip.passengerName).toBe("Test Passenger");
    expect(trip.travelClass).toBe("CC");
    expect(trip.status).toBe("on-time");
    expect(trip.segments).toHaveLength(1);
    expect(trip.segments[0].trainName).toBe("Vande Bharat Express");
    expect(trip.segments[0].trainNumber).toBe("20608");
    expect(trip.segments[0].departureStation.code).toBe("SBC");
    expect(trip.segments[0].arrivalStation.code).toBe("MAS");
  });

  it("correctly maps cancelled DbTrip status and assigns disruption rationale", () => {
    const dbTrip: DbTrip = {
      id: "trip-uuid-2",
      passenger_id: "usr_test",
      passenger_name: "Test Passenger",
      train_number: "12627",
      from_station_code: "SBC",
      to_station_code: "NDLS",
      status: "CANCELLED",
      pnr: "9988776655",
      seat_info: {
        coach: "B1",
        berth: "15",
        class: "3A",
      },
      departure_time: "2026-10-16T19:20:00Z",
      arrival_time: "2026-10-18T10:30:00Z",
      disruption_id: "dis-123",
    };

    const trip = dbTripToAppTrip(dbTrip);

    expect(trip.status).toBe("cancelled");
    expect(trip.disruptionReason).toBeDefined();
    expect(trip.disruptionReason).toContain("emergency track maintenance");
  });

  it("maps rebooked trip to recovered status", () => {
    const dbTrip: DbTrip = {
      id: "trip-uuid-3",
      passenger_id: "usr_test",
      passenger_name: "Test Passenger",
      train_number: "12028",
      from_station_code: "SBC",
      to_station_code: "MAS",
      status: "REBOOKED",
      seat_info: { coach: "B2", berth: "18", class: "3A" },
      departure_time: "2026-10-16T07:15:00Z",
      arrival_time: "2026-10-16T11:55:00Z",
    };

    const trip = dbTripToAppTrip(dbTrip);
    expect(trip.status).toBe("recovered");
  });

  it("maps DbDisruption to UI Notification model", () => {
    const disruption: DbDisruption = {
      id: "dis-uuid-1",
      trip_id: "trip-uuid-1",
      type: "TRACK_MAINTENANCE_DELAY",
      severity: "CRITICAL",
      description: "Severe delay expected near Bhopal Junction due to track interlocking works.",
      started_at: "2026-10-15T10:00:00Z",
      source: "sim",
    };

    const notif = dbDisruptionToNotification(disruption);

    expect(notif.id).toBe("dis-uuid-1");
    expect(notif.tripId).toBe("trip-uuid-1");
    expect(notif.title).toBe("TRACK MAINTENANCE DELAY");
    expect(notif.message).toBe(disruption.description);
    expect(notif.read).toBe(false);
  });

  it("identifies PostgREST schema cache and missing table errors", async () => {
    const { isTableMissing } = await import("../supabase-client");

    expect(isTableMissing(null)).toBe(false);
    expect(isTableMissing({ message: "Network error" })).toBe(false);
    expect(
      isTableMissing({
        message: "Could not find the table 'public.trips' in the schema cache",
        code: "PGRST204",
      })
    ).toBe(true);
    expect(
      isTableMissing({
        message: "Could not find the table 'public.disruptions' in the schema cache",
      })
    ).toBe(true);
    expect(
      isTableMissing({
        code: "42P01",
        message: 'relation "trips" does not exist',
      })
    ).toBe(true);
  });
});

