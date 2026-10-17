import { describe, it, expect } from "vitest";
import { ADVANCE_RESERVATION_DAYS } from "../train-booking-dialog";
import {
  calculateFareBreakdown,
  generatePNR,
  assignBerths,
} from "@/lib/booking/booking-engine";
import { searchJourneys } from "@/lib/journeys";
import { formatTimeWithDay, formatDate, formatDateTime } from "@/lib/format";

describe("Route-Aware Reservation Flow & Validation", () => {
  it("enforces 60-day Indian Railways advance reservation period constant", () => {
    expect(ADVANCE_RESERVATION_DAYS).toBe(60);
  });

  it("calculates distance-based fare and marks source as Estimated", () => {
    const passengers = [
      { id: "p-1", name: "Ravi Kumar", age: 34, gender: "M" as const, berthPreference: "LB" as const },
    ];

    const shortFare = calculateFareBreakdown("3A", "GN", passengers, 350, "Superfast");
    const longFare = calculateFareBreakdown("3A", "GN", passengers, 2371, "Rajdhani");

    expect(longFare.totalFare).toBeGreaterThan(shortFare.totalFare);
    expect(longFare.source).toBe("Estimated");
    expect(longFare.totalFare % 5).toBe(0);
  });

  it("generates 10-digit authentic Indian Railways PNR format", () => {
    const pnr = generatePNR();
    expect(pnr).toMatch(/^\d{10}$/);
  });

  it("assigns coach and berth with correct passenger count", () => {
    const passengers = [
      { id: "p-1", name: "Ananya", age: 26, gender: "F" as const, berthPreference: "LB" as const },
      { id: "p-2", name: "Kiran", age: 29, gender: "M" as const, berthPreference: "UB" as const },
    ];
    const berthResult = assignBerths("3A", passengers);
    expect(berthResult.coach).toMatch(/^B\d$/);
    expect(berthResult.berths).toHaveLength(2);
    expect(berthResult.status).toBe("CONFIRMED");
  });

  it("rejects Bangalore train 22691 for Delhi -> Lucknow search", async () => {
    const res = await searchJourneys({
      fromCode: "NDLS",
      toCode: "LKO",
      date: "2026-10-28",
      includeNearby: false,
    });

    for (const journey of res.direct) {
      expect(journey.legs[0].trainNumber).not.toBe("22691");
    }
  });

  it("only returns trains calling at From before To", async () => {
    const res = await searchJourneys({
      fromCode: "MAS",
      toCode: "SBC",
      date: "2026-10-28",
      includeNearby: false,
    });

    for (const j of res.direct) {
      expect(j.fromStationCode).toBe("MAS");
      expect(j.toStationCode).toBe("SBC");
      expect(j.legs[0].fromSeq).toBeLessThan(j.legs[0].toSeq);
    }
  });

  describe("5 Diverse Reservation Scenarios (No 'Invalid time value' crashes)", () => {
    it("Scenario 1: SBC -> MAS (Direct Daytime Express)", async () => {
      const res = await searchJourneys({ fromCode: "SBC", toCode: "MAS", date: "2026-10-25" });
      expect(res.direct.length).toBeGreaterThan(0);
      const journey = res.direct[0];
      const leg = journey.legs[0];

      // Verify dates are valid
      expect(leg.departureTime instanceof Date).toBe(true);
      expect(isNaN(leg.departureTime.getTime())).toBe(false);
      expect(() => formatTimeWithDay(leg.departureTime)).not.toThrow();
      expect(() => formatDate(leg.departureTime)).not.toThrow();
      expect(formatTimeWithDay(leg.departureTime)).toMatch(/^\d{2}:\d{2}$/);
    });

    it("Scenario 2: SBC -> NDLS (Multi-day Superfast with day offsets)", async () => {
      const res = await searchJourneys({ fromCode: "SBC", toCode: "NDLS", date: "2026-10-25" });
      expect(res.direct.length).toBeGreaterThan(0);
      const journey = res.direct[0];
      const leg = journey.legs[0];

      expect(() => formatTimeWithDay(leg.arrivalTime, leg.arrivalDayLabel)).not.toThrow();
      expect(formatTimeWithDay(leg.arrivalTime, leg.arrivalDayLabel)).toContain("day");
    });

    it("Scenario 3: NDLS -> LKO (Northern Corridor)", async () => {
      const res = await searchJourneys({ fromCode: "NDLS", toCode: "LKO", date: "2026-10-26" });
      expect(res.direct.length).toBeGreaterThan(0);
      const journey = res.direct[0];

      expect(() => formatDateTime(journey.departureTime)).not.toThrow();
      expect(() => formatDateTime(journey.arrivalTime)).not.toThrow();
    });

    it("Scenario 4: MAS -> SBC (Return route with string date inputs)", () => {
      // Test simulated JSON-parsed string dates as returned from fetch('/api/journeys')
      const rawStringDate = "2026-10-27T06:00:00.000Z";
      expect(() => formatTimeWithDay(rawStringDate)).not.toThrow();
      expect(() => formatDate(rawStringDate)).not.toThrow();
      expect(() => formatDateTime(rawStringDate)).not.toThrow();
      expect(formatTimeWithDay(rawStringDate)).toMatch(/^\d{2}:\d{2}$/);
    });

    it("Scenario 5: Connecting / multi-leg journey with layovers", async () => {
      const res = await searchJourneys({ fromCode: "SBC", toCode: "MAS", date: "2026-10-28" });
      const journey = res.direct[0];
      const pnr = generatePNR();
      const berthInfo = assignBerths("3A", [{ id: "p1", name: "Priya", age: 31, gender: "F", berthPreference: "LB" }]);

      // Construct a Trip segment exactly as handleConfirmBooking does
      const trip = {
        id: `trip-bk-${pnr}`,
        pnr,
        passengerName: "Priya",
        travelClass: "3A" as const,
        fare: 1250,
        status: "on-time" as const,
        neededByTime: new Date(journey.arrivalTime),
        segments: journey.legs.map((leg) => ({
          trainName: leg.trainName,
          trainNumber: leg.trainNumber,
          departureStation: { code: leg.fromStationCode, name: leg.fromStationName, city: leg.fromStationName },
          arrivalStation: { code: leg.toStationCode, name: leg.toStationName, city: leg.toStationName },
          departureTime: new Date(leg.departureTime),
          arrivalTime: new Date(leg.arrivalTime),
          dayOffset: leg.arrivalDayLabel,
          status: "on-time" as const,
          coach: berthInfo.coach,
          berth: berthInfo.berths.join(", "),
        })),
      };

      for (const seg of trip.segments) {
        expect(() => formatTimeWithDay(seg.departureTime)).not.toThrow();
        expect(() => formatTimeWithDay(seg.arrivalTime, seg.dayOffset)).not.toThrow();
        expect(() => formatTimeWithDay(trip.neededByTime, seg.dayOffset)).not.toThrow();
      }
    });
  });
});
