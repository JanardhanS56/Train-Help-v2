/**
 * lib/sim/__tests__/sim-engine.test.ts
 * Comprehensive Vitest unit tests for the pure simulation engine modules.
 */

import { describe, it, expect } from "vitest";
import { expandSchedule, isTrainRunningOnDate } from "../schedule";
import { calculatePosition } from "../movement";
import { createObstacle } from "../obstacles";
import { findDetourPath, generateCandidatePlans } from "../planner";
import { createInitialClock, stepClock, stepToNextStation, scrubClock } from "../clock";
import type { TrainWithStops, DbRailLink } from "@/lib/data/types";
import type { SimScheduleStop } from "../types";

// Mock 3-stop train for deterministic testing
const mockTrain: TrainWithStops = {
  train_number: "22691",
  train_name: "Bengaluru Rajdhani Express",
  train_type: "Rajdhani",
  railway_zone: "South Western Railway (SWR)",
  origin_station_code: "SBC",
  destination_station_code: "NZM",
  origin_name: "KSR Bengaluru City",
  destination_name: "Hazrat Nizamuddin",
  days_running: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  total_distance_km: 2365,
  total_duration_min: 2035, // 33h 55m
  stops_count: 4,
  has_official_timing: true,
  stops: [
    {
      train_number: "22691",
      seq: 1,
      station_code: "SBC",
      station_name: "KSR Bengaluru City",
      arrival_min: null,
      departure_min: 1200, // 20:00 (Day 0)
      arrival_formatted: "20:00",
      departure_formatted: "20:00",
      day_offset: 0,
      distance_km: 0,
      halt_min: 0,
      time_source: "official",
      latitude: 12.977595,
      longitude: 77.568083,
    },
    {
      train_number: "22691",
      seq: 2,
      station_code: "SC",
      station_name: "Secunderabad Junction",
      arrival_min: 1875, // 07:15 (Day 1: 1440 + 435)
      departure_min: 1890, // 07:30 (Day 1)
      arrival_formatted: "07:15 (+1d)",
      departure_formatted: "07:30 (+1d)",
      day_offset: 1,
      distance_km: 700,
      halt_min: 15,
      time_source: "official",
      latitude: 17.434444,
      longitude: 78.501944,
    },
    {
      train_number: "22691",
      seq: 3,
      station_code: "NGP",
      station_name: "Nagpur Junction",
      arrival_min: 2360, // 15:20 (Day 1: 1440 + 920)
      departure_min: 2370, // 15:30 (Day 1)
      arrival_formatted: "15:20 (+1d)",
      departure_formatted: "15:30 (+1d)",
      day_offset: 1,
      distance_km: 1280,
      halt_min: 10,
      time_source: "official",
      latitude: 21.152222,
      longitude: 79.088611,
    },
    {
      train_number: "22691",
      seq: 4,
      station_code: "NZM",
      station_name: "Hazrat Nizamuddin",
      arrival_min: 3235, // 05:55 (Day 2: 2880 + 355)
      departure_min: null,
      arrival_formatted: "05:55 (+2d)",
      departure_formatted: "05:55 (+2d)",
      day_offset: 2,
      distance_km: 2365,
      halt_min: 0,
      time_source: "official",
      latitude: 28.58733,
      longitude: 77.254249,
    },
  ],
};

const mockRailLinks: DbRailLink[] = [
  { station_a: "SBC", station_b: "SC", distance_km: 700, typical_duration_min: 675, traversals: 12 },
  { station_a: "SC", station_b: "NGP", distance_km: 580, typical_duration_min: 470, traversals: 15 },
  { station_a: "NGP", station_b: "NZM", distance_km: 1085, typical_duration_min: 865, traversals: 18 },
  // Alternate chord link bypassing SC -> NGP via Kazipet / Ballarshah chord
  { station_a: "SC", station_b: "BPQ", distance_km: 360, typical_duration_min: 300, traversals: 8 },
  { station_a: "BPQ", station_b: "NZM", distance_km: 1250, typical_duration_min: 990, traversals: 6 },
];

describe("Schedule Model", () => {
  it("correctly expands schedule across day rollovers (+1d, +2d)", () => {
    const stops = expandSchedule(mockTrain);
    expect(stops).toHaveLength(4);
    expect(stops[0].departureMin).toBe(1200); // 20:00 Day 0
    expect(stops[1].arrivalMin).toBe(1875);   // 07:15 Day 1 (1440 + 435)
    expect(stops[3].arrivalMin).toBe(3235);   // 05:55 Day 2 (2880 + 355)
    expect(stops[3].departureMin).toBe(3235); // Destination departure = arrival
  });

  it("validates weekday running days accurately", () => {
    // 2026-10-12 is Monday
    const monday = new Date("2026-10-12T12:00:00Z");
    expect(isTrainRunningOnDate(mockTrain, monday)).toBe(true);

    const restrictedTrain: TrainWithStops = {
      ...mockTrain,
      days_running: ["Fri", "Sun"],
    };
    expect(isTrainRunningOnDate(restrictedTrain, monday)).toBe(false);
  });
});

describe("Movement & Kinematics Model", () => {
  const stops: SimScheduleStop[] = expandSchedule(mockTrain);

  it("handles state before origin departure", () => {
    const pos = calculatePosition(stops, 1100, [], "Rajdhani");
    expect(pos.state).toBe("scheduled");
    expect(pos.distanceKm).toBe(0);
    expect(pos.currentSpeedKmph).toBe(0);
  });

  it("interpolates smooth movement and cruise speed between stops", () => {
    // Midway between SBC (1200) and SC (1875) at minute 1500
    const pos = calculatePosition(stops, 1500, [], "Rajdhani");
    expect(pos.state).toBe("running");
    expect(pos.distanceKm).toBeGreaterThan(200);
    expect(pos.distanceKm).toBeLessThan(500);
    expect(pos.currentSpeedKmph).toBeGreaterThan(60);
    expect(pos.latitude).toBeGreaterThan(12.9);
    expect(pos.latitude).toBeLessThan(17.5);
  });

  it("dwells at intermediate halt with speed 0", () => {
    // SC halt is from 1875 to 1890
    const pos = calculatePosition(stops, 1880, [], "Rajdhani");
    expect(pos.state).toBe("dwelling");
    expect(pos.currentSpeedKmph).toBe(0);
    expect(pos.currentStationCode).toBe("SC");
    expect(pos.distanceKm).toBe(700);
  });

  it("brakes and halts safely before an active track blockage", () => {
    const obstacle = createObstacle({
      type: "track_blockage",
      title: "Landslide on Secunderabad-Nagpur track",
      description: "Debris on track",
      locationType: "segment",
      fromStationCode: "SC",
      toStationCode: "NGP",
      startMinute: 1950,
      durationMinutes: 90,
      effect: "full_block",
    });

    // Train traveling during obstacle
    const pos = calculatePosition(stops, 1980, [obstacle], "Rajdhani");
    expect(pos.state).toBe("blocked");
    expect(pos.currentSpeedKmph).toBe(0);
    expect(pos.activeObstacleId).toBe(obstacle.id);
  });

  it("propagates delay to downstream stops after obstacle clearance", () => {
    const obstacle = createObstacle({
      type: "signal_failure",
      title: "Interlocking failure",
      description: "Interlocking fault",
      locationType: "segment",
      fromStationCode: "SC",
      toStationCode: "NGP",
      startMinute: 1920,
      durationMinutes: 60,
      effect: "full_block",
    });

    // Check position after obstacle duration has passed
    const pos = calculatePosition(stops, 2100, [obstacle], "Rajdhani");
    expect(pos.delayMinutes).toBeGreaterThanOrEqual(60);
  });
});

describe("AI Decision Engine / Planner", () => {
  const stops = expandSchedule(mockTrain);
  const pos = calculatePosition(stops, 1950, [], "Rajdhani");
  const obstacle = createObstacle({
    type: "track_blockage",
    title: "Track Washout",
    description: "Flooding near Ballarshah",
    locationType: "segment",
    fromStationCode: "SC",
    toStationCode: "NGP",
    startMinute: 1920,
    durationMinutes: 120,
    uncertaintyMinutes: 30,
    effect: "full_block",
  });

  it("never routes a diversion through a blocked segment", () => {
    const detour = findDetourPath("SC", "NZM", mockRailLinks, "SC", "NGP");
    expect(detour).not.toBeNull();
    // Path should use BPQ instead of NGP
    expect(detour!.path).toContain("BPQ");
    expect(detour!.path).not.toContain("NGP");
  });

  it("generates deterministic and ranked candidate responses", () => {
    const plans1 = generateCandidatePlans(mockTrain, pos, obstacle, mockRailLinks);
    const plans2 = generateCandidatePlans(mockTrain, pos, obstacle, mockRailLinks);

    expect(plans1).toHaveLength(4);
    expect(plans1[0].recommended).toBe(true);
    // Reproducibility
    expect(plans1[0].id).toBe(plans2[0].id);
    expect(plans1[0].score).toBe(plans2[0].score);
    expect(plans1[0].delayMinutes).toBe(plans2[0].delayMinutes);
  });
});

describe("Virtual Simulation Clock", () => {
  const stops = expandSchedule(mockTrain);

  it("steps forward and backward accurately", () => {
    const clock = createInitialClock(1200, 3235);
    const c1 = stepClock(clock, 30);
    expect(c1.currentMinute).toBe(1230);
    const c2 = stepClock(c1, -15);
    expect(c2.currentMinute).toBe(1215);
  });

  it("steps directly to the next upcoming station arrival", () => {
    const clock = createInitialClock(1200, 3235);
    const c1 = stepToNextStation(clock, stops);
    expect(c1.currentMinute).toBe(1875); // SC arrival
  });

  it("scrubs within valid boundaries without exceeding limits", () => {
    const clock = createInitialClock(1200, 3235);
    const scrubbed = scrubClock(clock, 5000);
    expect(scrubbed.currentMinute).toBe(3235);
  });
});
