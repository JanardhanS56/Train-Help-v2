import { describe, it, expect } from "vitest";
import { ADVANCE_RESERVATION_DAYS } from "../train-booking-dialog";
import {
  calculateFareBreakdown,
  generatePNR,
  assignBerths,
} from "@/lib/booking/booking-engine";
import { searchJourneys } from "@/lib/journeys";

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
});
