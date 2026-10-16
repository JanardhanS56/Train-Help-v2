import { describe, it, expect } from "vitest";
import { evaluateAlternatives, isInDepartureWindow } from "../matching";
import { DEFAULT_PREFERENCES } from "../constants";
import type { Alternative, UserPreferences, Trip } from "../types";

describe("Preferences Matching & Dynamic Ranking Engine", () => {
  const baseTrip: Trip = {
    id: "trip-test-1",
    pnr: "1234567890",
    passengerName: "Vikram Sharma",
    travelClass: "3A",
    fare: 1450,
    status: "delayed",
    segments: [
      {
        trainName: "Bangalore Rajdhani",
        trainNumber: "22691",
        departureStation: { code: "SBC", name: "Bengaluru", city: "Bengaluru" },
        arrivalStation: { code: "NDLS", name: "New Delhi", city: "New Delhi" },
        departureTime: new Date("2026-10-20T20:00:00Z"),
        arrivalTime: new Date("2026-10-22T05:55:00Z"),
        status: "delayed",
      },
    ],
  };

  // Diverse multi-class realistic alternatives pool on the same corridor
  const mockAlternatives: Alternative[] = [
    {
      id: "alt-1-1A",
      tripId: "trip-test-1",
      trainName: "Rajdhani Express",
      trainNumber: "22691",
      fromStation: { code: "SBC", name: "Bengaluru", city: "Bengaluru" },
      toStation: { code: "NDLS", name: "New Delhi", city: "New Delhi" },
      departureTime: new Date("2026-10-20T20:00:00Z"),
      arrivalTime: new Date("2026-10-22T05:30:00Z"),
      duration: 2010,
      changes: 0,
      changeStations: [],
      travelClass: "1A",
      fare: 4850,
      originalFare: 1450,
      fareDifference: 3400,
      availability: { type: "available", label: "AVAILABLE 4", count: 4 },
    },
    {
      id: "alt-1-3A",
      tripId: "trip-test-1",
      trainName: "Rajdhani Express",
      trainNumber: "22691",
      fromStation: { code: "SBC", name: "Bengaluru", city: "Bengaluru" },
      toStation: { code: "NDLS", name: "New Delhi", city: "New Delhi" },
      departureTime: new Date("2026-10-20T20:00:00Z"),
      arrivalTime: new Date("2026-10-22T05:30:00Z"),
      duration: 2010,
      changes: 0,
      changeStations: [],
      travelClass: "3A",
      fare: 2040,
      originalFare: 1450,
      fareDifference: 590,
      availability: { type: "available", label: "AVAILABLE 28", count: 28 },
    },
    {
      id: "alt-2-SL",
      tripId: "trip-test-1",
      trainName: "Karnataka Express",
      trainNumber: "12627",
      fromStation: { code: "SBC", name: "Bengaluru", city: "Bengaluru" },
      toStation: { code: "NDLS", name: "New Delhi", city: "New Delhi" },
      departureTime: new Date("2026-10-20T19:20:00Z"),
      arrivalTime: new Date("2026-10-22T05:00:00Z"),
      duration: 2020,
      changes: 0,
      changeStations: [],
      travelClass: "SL",
      fare: 780,
      originalFare: 1450,
      fareDifference: -670,
      availability: { type: "available", label: "AVAILABLE 82", count: 82 },
    },
  ];

  it("evaluates default preferences and includes affordable and matching options", () => {
    const res = evaluateAlternatives(mockAlternatives, DEFAULT_PREFERENCES, baseTrip);
    expect(res.eligible.length).toBeGreaterThan(0);
    expect(res.ranked.length).toBe(res.eligible.length);
  });

  it("strictly excludes alternatives above maxBudget", () => {
    const tightBudgetPrefs: UserPreferences = {
      ...DEFAULT_PREFERENCES,
      maxBudget: 1000,
    };

    const res = evaluateAlternatives(mockAlternatives, tightBudgetPrefs, baseTrip);
    // Only alt-2-SL (780) should pass; alt-1-1A (4850) and alt-1-3A (2040) should be excluded
    const eligibleIds = res.eligible.map((a) => a.id);
    expect(eligibleIds).toContain("alt-2-SL");
    expect(eligibleIds).not.toContain("alt-1-1A");
    expect(eligibleIds).not.toContain("alt-1-3A");
  });

  it("strictly enforces onlyTheseClasses when toggled", () => {
    const sleeperOnlyPrefs: UserPreferences = {
      ...DEFAULT_PREFERENCES,
      classes: ["SL"],
      onlyTheseClasses: true,
      maxBudget: 5000,
    };

    const res = evaluateAlternatives(mockAlternatives, sleeperOnlyPrefs, baseTrip);
    const eligibleIds = res.eligible.map((a) => a.id);
    expect(eligibleIds).toEqual(["alt-2-SL"]);
  });

  it("correctly identifies departure time windows", () => {
    // 06:00 is early-morning
    const earlyMorning = new Date("2026-10-20T06:00:00");
    expect(isInDepartureWindow(earlyMorning, "early-morning")).toBe(true);
    expect(isInDepartureWindow(earlyMorning, "evening")).toBe(false);

    // 19:20 is evening
    const evening = new Date("2026-10-20T19:20:00");
    expect(isInDepartureWindow(evening, "evening")).toBe(true);
    expect(isInDepartureWindow(evening, "morning")).toBe(false);
  });

  it("ranks lowest fare first when priorityProfile is lowest-fare", () => {
    const lowestFarePrefs: UserPreferences = {
      ...DEFAULT_PREFERENCES,
      priorityProfile: "lowest-fare",
      maxBudget: 5000,
      classes: ["1A", "3A", "SL"],
    };

    const res = evaluateAlternatives(mockAlternatives, lowestFarePrefs, baseTrip);
    // Cheapest is SL (780)
    expect(res.ranked[0].id).toBe("alt-2-SL");
    expect(res.ranked[0].fare).toBe(780);
  });

  it("ranks premium class first when preferred class is selected", () => {
    const firstClassPrefs: UserPreferences = {
      ...DEFAULT_PREFERENCES,
      priorityProfile: "comfort",
      maxBudget: 6000,
      classes: ["1A"],
      onlyTheseClasses: false,
    };

    const res = evaluateAlternatives(mockAlternatives, firstClassPrefs, baseTrip);
    // 1A matches the preferred class and receives the top ranking
    expect(res.ranked[0].travelClass).toBe("1A");
  });
});
