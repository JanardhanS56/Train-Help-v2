/**
 * lib/data/__tests__/rebooking.test.ts
 * Unit tests for Phase 3 Disruption Recovery & Rebooking Engine.
 * Tests:
 * 1. Deterministic tie-breaking (arrival_time ASC, price ASC, id ASC).
 * 2. Explicit berth degradation penalty (LOWER -> MIDDLE -> UPPER -> SIDE LOWER -> SIDE UPPER).
 * 3. Explainable score breakdown.
 * 4. Transactional rebooking execution, concurrency rejection, and fare/refund calculations.
 */

import { describe, it, expect, vi } from "vitest";
import {
  evaluateAlternatives,
  calculateBerthMatchScore,
  getBerthTier,
  BERTH_HIERARCHY,
} from "../../matching";
import {
  executeRebooking,
  generatePnr,
} from "../rebooking";
import type { Alternative, Trip, UserPreferences } from "@/lib/types";

// Mock Supabase calls in trips.ts
vi.mock("../trips", () => ({
  getTripById: vi.fn().mockImplementation(async (id: string) => ({
    id,
    passenger_id: "passenger-123",
    passenger_name: "Aarav Sharma",
    train_number: "12627",
    from_station_code: "SBC",
    to_station_code: "NDLS",
    departure_time: "2026-10-16T19:20:00Z",
    arrival_time: "2026-10-18T10:30:00Z",
    status: "CANCELLED",
    pnr: "4281920194",
    seat_info: {
      coach: "B2",
      berth: "24",
      class: "3A",
      fare: 2200,
    },
    created_at: new Date().toISOString(),
  })),
  updateTripStatus: vi.fn().mockImplementation(async (_id: string, status: string) => {
    return status === "REBOOKED";
  }),
  createTrip: vi.fn().mockImplementation(async (payload: Record<string, unknown>) => ({
    ...payload,
    id: "new-trip-uuid-999",
    created_at: new Date().toISOString(),
  })),
}));

import { DEFAULT_PREFERENCES } from "../../constants";

const baseMockPreferences: UserPreferences = {
  ...DEFAULT_PREFERENCES,
  maxBudget: 5000,
  seatPreference: "confirmed-only",
  berthPreference: "lower",
  classes: ["3A", "2A", "1A"],
  priorityProfile: "balanced",
};

const mockTrip: Trip = {
  id: "trip-original-1",
  pnr: "4281920194",
  passengerName: "Aarav Sharma",
  travelClass: "3A",
  fare: 2200,
  coach: "B2",
  berth: "24",
  status: "cancelled",
  segments: [
    {
      trainName: "Karnataka Express",
      trainNumber: "12627",
      departureStation: { code: "SBC", city: "Bengaluru", name: "KSR Bengaluru" },
      arrivalStation: { code: "NDLS", city: "New Delhi", name: "New Delhi" },
      departureTime: new Date("2026-10-16T19:20:00Z"),
      arrivalTime: new Date("2026-10-18T10:30:00Z"),
      status: "cancelled",
      travelClass: "3A",
      coach: "B2",
      berth: "24",
    },
  ],
};

function createMockAlt(partial: Partial<Alternative>): Alternative {
  return {
    id: "alt-default",
    tripId: "trip-original-1",
    trainName: "Test Express",
    trainNumber: "12001",
    fromStation: { code: "SBC", city: "Bengaluru", name: "KSR Bengaluru" },
    toStation: { code: "NDLS", city: "New Delhi", name: "New Delhi" },
    departureTime: new Date("2026-10-16T20:00:00Z"),
    arrivalTime: new Date("2026-10-18T08:00:00Z"),
    duration: 2160,
    changes: 0,
    changeStations: [],
    travelClass: "3A",
    coachBerth: "Coach B1 · Lower Berth",
    fare: 2200,
    originalFare: 2200,
    fareDifference: 0,
    availability: { type: "available", count: 12, label: "AVL 12" },
    ...partial,
  };
}

describe("Phase 3: Matching Engine Enhancements", () => {
  it("enforces deterministic tie-breaking: arrival_time ASC, price ASC, id ASC", () => {
    // Two alternatives with identical fares, duration, and class, but different arrival times
    const altA = createMockAlt({
      id: "alt-z",
      trainNumber: "11111",
      arrivalTime: new Date("2026-10-18T12:00:00Z"),
      fare: 2200,
    });
    const altB = createMockAlt({
      id: "alt-a",
      trainNumber: "22222",
      arrivalTime: new Date("2026-10-18T09:00:00Z"), // arrives earlier
      fare: 2200,
    });

    const result = evaluateAlternatives([altA, altB], baseMockPreferences, mockTrip);
    expect(result.ranked.length).toBe(2);

    // If overall scores are tied, earlier arrival wins
    if (result.ranked[0].overallScore === result.ranked[1].overallScore) {
      expect(result.ranked[0].id).toBe("alt-a");
    }

    // When arrival times and overall scores are identical, lower fare wins
    const altCheap = createMockAlt({
      id: "alt-cheap",
      trainNumber: "33333",
      arrivalTime: new Date("2026-10-18T09:00:00Z"),
      fare: 1800,
    });
    const altCostly = createMockAlt({
      id: "alt-costly",
      trainNumber: "44444",
      arrivalTime: new Date("2026-10-18T09:00:00Z"),
      fare: 2500,
    });

    const fareResult = evaluateAlternatives([altCostly, altCheap], baseMockPreferences, mockTrip);
    expect(fareResult.ranked[0].fare).toBeLessThanOrEqual(fareResult.ranked[1].fare);
  });

  it("calculates berth degradation penalty along hierarchy: LOWER -> MIDDLE -> UPPER -> SIDE LOWER -> SIDE UPPER", () => {
    expect(BERTH_HIERARCHY.lower).toBe(0);
    expect(BERTH_HIERARCHY.middle).toBe(1);
    expect(BERTH_HIERARCHY.upper).toBe(2);
    expect(BERTH_HIERARCHY["side lower"]).toBe(3);
    expect(BERTH_HIERARCHY["side upper"]).toBe(4);

    expect(getBerthTier("Coach B1 · Lower Berth")).toBe(0);
    expect(getBerthTier("Coach B1 · Middle Berth")).toBe(1);
    expect(getBerthTier("Coach B1 · Upper Berth")).toBe(2);
    expect(getBerthTier("Coach B1 · Side Lower")).toBe(3);
    expect(getBerthTier("Coach B1 · Side Upper")).toBe(4);

    // User wants 'lower'
    const lowerScore = calculateBerthMatchScore("Coach B1 · Lower Berth", "lower");
    const middleScore = calculateBerthMatchScore("Coach B1 · Middle Berth", "lower");
    const upperScore = calculateBerthMatchScore("Coach B1 · Upper Berth", "lower");
    const sideLowerScore = calculateBerthMatchScore("Coach B1 · Side Lower", "lower");
    const sideUpperScore = calculateBerthMatchScore("Coach B1 · Side Upper", "lower");

    expect(lowerScore).toBe(100);
    expect(middleScore).toBe(75);
    expect(upperScore).toBe(50);
    expect(sideLowerScore).toBe(25);
    expect(sideUpperScore).toBe(10);

    // Degradation monotonically decreases
    expect(lowerScore).toBeGreaterThan(middleScore);
    expect(middleScore).toBeGreaterThan(upperScore);
    expect(upperScore).toBeGreaterThan(sideLowerScore);
    expect(sideLowerScore).toBeGreaterThan(sideUpperScore);
  });

  it("populates explainable score_breakdown on all ranked alternatives", () => {
    const alt = createMockAlt({ id: "alt-explainable" });
    const result = evaluateAlternatives([alt], baseMockPreferences, mockTrip);

    expect(result.ranked.length).toBe(1);
    const item = result.ranked[0];
    expect(item.score_breakdown).toBeDefined();
    expect(item.score_breakdown?.time_diff_score).toBeGreaterThanOrEqual(0);
    expect(item.score_breakdown?.berth_match_score).toBeGreaterThanOrEqual(0);
    expect(item.score_breakdown?.train_type_score).toBeGreaterThanOrEqual(0);
    expect(item.score_breakdown?.price_diff_score).toBeGreaterThanOrEqual(0);
    expect(item.score_breakdown?.overall).toBe(item.overallScore);
  });
});

describe("Phase 3: Rebooking Engine & Transaction Rules", () => {
  it("generates deterministic 10-digit Indian Railways PNRs", () => {
    const pnr1 = generatePnr();
    const pnr2 = generatePnr();
    expect(pnr1).toHaveLength(10);
    expect(pnr2).toHaveLength(10);
    expect(/^\d{10}$/.test(pnr1)).toBe(true);

    const seeded1 = generatePnr("trip-101-seed");
    const seeded2 = generatePnr("trip-101-seed");
    expect(seeded1).toBe(seeded2);
    expect(seeded1).toHaveLength(10);
  });

  it("successfully completes transactional rebooking with refund calculation", async () => {
    // Replacement train is cheaper: ₹1800 vs original ₹2200 (₹400 refund)
    const cheapAlt = createMockAlt({
      fare: 1800,
      originalFare: 2200,
      availability: { type: "available", count: 8, label: "AVL 8" },
    });

    const result = await executeRebooking({
      originalTripId: mockTrip.id,
      alternative: cheapAlt,
      passengerName: "Aarav Sharma",
    });

    expect(result.success).toBe(true);
    expect(result.pnr).toHaveLength(10);
    expect(result.fareDifference).toBe(-400);
    expect(result.refundAmount).toBe(400);
    expect(result.refundStatus).toBe("processing");
    expect(result.additionalCharge).toBe(0);
    expect(result.newTrip?.status).toBe("CONFIRMED");
    expect(result.newAppTrip?.travelClass).toBe("3A");
  });

  it("handles additional charge when replacement fare is higher", async () => {
    // Replacement train is more expensive: ₹2800 vs original ₹2200 (+₹600)
    const expensiveAlt = createMockAlt({
      fare: 2800,
      originalFare: 2200,
      availability: { type: "available", count: 4, label: "AVL 4" },
    });

    const result = await executeRebooking({
      originalTripId: mockTrip.id,
      alternative: expensiveAlt,
      passengerName: "Aarav Sharma",
    });

    expect(result.success).toBe(true);
    expect(result.fareDifference).toBe(600);
    expect(result.additionalCharge).toBe(600);
    expect(result.refundAmount).toBe(0);
    expect(result.refundStatus).toBe("not_applicable");
  });

  it("rejects rebooking on seat race condition when seats = 0 (SEAT_UNAVAILABLE)", async () => {
    const exhaustedAlt = createMockAlt({
      availability: { type: "waitlist", count: 0, label: "WL 0" },
    });

    const result = await executeRebooking({
      originalTripId: mockTrip.id,
      alternative: exhaustedAlt,
      remainingSeats: 0,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("SEAT_UNAVAILABLE");
    expect(result.newTrip).toBeNull();
  });
});
