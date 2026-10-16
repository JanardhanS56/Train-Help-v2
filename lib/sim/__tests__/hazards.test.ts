import { describe, it, expect } from "vitest";
import {
  classifyRailwayRegion,
  getPlausibleHazardsForRoute,
  suggestRealisticObstacle,
} from "../hazards";
import { calculatePosition } from "../movement";
import type { SimScheduleStop, Obstacle } from "../types";

describe("Hazard Plausibility Engine", () => {
  const konkanStops: SimScheduleStop[] = [
    {
      seq: 1,
      stationCode: "ROHA",
      stationName: "Roha",
      latitude: 18.43,
      longitude: 73.12,
      arrivalMin: 360,
      departureMin: 365,
      haltMin: 5,
      distanceKm: 0,
      dayOffset: 0,
      timeSource: "official",
    },
    {
      seq: 2,
      stationCode: "CHI",
      stationName: "Chiplun",
      latitude: 17.53,
      longitude: 73.52,
      arrivalMin: 450,
      departureMin: 455,
      haltMin: 5,
      distanceKm: 140,
      dayOffset: 0,
      timeSource: "official",
    },
    {
      seq: 3,
      stationCode: "RN",
      stationName: "Ratnagiri",
      latitude: 16.98,
      longitude: 73.33,
      arrivalMin: 540,
      departureMin: 545,
      haltMin: 5,
      distanceKm: 245,
      dayOffset: 0,
      timeSource: "official",
    },
  ];

  const gangeticStops: SimScheduleStop[] = [
    {
      seq: 1,
      stationCode: "NDLS",
      stationName: "New Delhi",
      latitude: 28.61,
      longitude: 77.23,
      arrivalMin: 360,
      departureMin: 365,
      haltMin: 5,
      distanceKm: 0,
      dayOffset: 0,
      timeSource: "official",
    },
    {
      seq: 2,
      stationCode: "CNB",
      stationName: "Kanpur Central",
      latitude: 26.45,
      longitude: 80.35,
      arrivalMin: 600,
      departureMin: 605,
      haltMin: 5,
      distanceKm: 440,
      dayOffset: 0,
      timeSource: "official",
    },
  ];

  it("classifies Konkan stations into konkan_ghats and Gangetic stations into northern_plains", () => {
    expect(classifyRailwayRegion(17.53, 73.52, "CHI")).toBe("konkan_ghats");
    expect(classifyRailwayRegion(28.61, 77.23, "NDLS")).toBe("northern_plains");
  });

  it("never includes tsunami or northern fog in Konkan hazards", () => {
    // Monsoon season (July = month 7)
    const monsoonHazards = getPlausibleHazardsForRoute(konkanStops, 7);
    const titles = monsoonHazards.map((h) => h.title.toLowerCase());

    // Never absurd tsunami
    expect(titles.some((t) => t.includes("tsunami"))).toBe(false);
    // Never Gangetic radiation fog
    expect(titles.some((t) => t.includes("dense radiation fog"))).toBe(false);
    // Includes ghat landslide in monsoon
    expect(titles.some((t) => t.includes("landslide"))).toBe(true);
  });

  it("returns dense fog for Northern plains in winter but not in summer", () => {
    const winterHazards = getPlausibleHazardsForRoute(gangeticStops, 12);
    expect(winterHazards.some((h) => h.id === "hz-dense-fog-winter")).toBe(true);

    const summerHazards = getPlausibleHazardsForRoute(gangeticStops, 6);
    expect(summerHazards.some((h) => h.id === "hz-dense-fog-winter")).toBe(false);
  });

  it("suggests realistic obstacle anchored to the upcoming segment", () => {
    const suggested = suggestRealisticObstacle(konkanStops, 380, 0, 7);
    expect(suggested).not.toBeNull();
    expect(suggested?.fromStationCode).toBe("ROHA");
    expect(suggested?.toStationCode).toBe("CHI");
    expect(suggested?.startMinute).toBeGreaterThanOrEqual(382);
  });
});

describe("Position-Aware Kinematics & Delay Cascades", () => {
  const testStops: SimScheduleStop[] = [
    {
      seq: 1,
      stationCode: "AAA",
      stationName: "Alpha",
      latitude: 12.0,
      longitude: 77.0,
      arrivalMin: 300,
      departureMin: 305,
      haltMin: 5,
      distanceKm: 0,
      dayOffset: 0,
      timeSource: "official",
    },
    {
      seq: 2,
      stationCode: "BBB",
      stationName: "Beta",
      latitude: 13.0,
      longitude: 78.0,
      arrivalMin: 400,
      departureMin: 405,
      haltMin: 5,
      distanceKm: 100,
      dayOffset: 0,
      timeSource: "official",
    },
    {
      seq: 3,
      stationCode: "CCC",
      stationName: "Gamma",
      latitude: 14.0,
      longitude: 79.0,
      arrivalMin: 500,
      departureMin: 505,
      haltMin: 5,
      distanceKm: 200,
      dayOffset: 0,
      timeSource: "official",
    },
  ];

  it("train 100km away on segment 1 runs on time even if an obstacle is placed on segment 2", () => {
    const obstacleOnSegment2: Obstacle = {
      id: "obs-2",
      type: "track_blockage",
      title: "Debris on Track",
      description: "Debris on Beta-Gamma",
      locationType: "segment",
      fromStationCode: "BBB",
      toStationCode: "CCC",
      startMinute: 320,
      durationMinutes: 60,
      uncertaintyMinutes: 10,
      effect: "full_block",
    };

    // Train is at minute 350 traveling on segment 1 (AAA -> BBB, which takes 305 to 400)
    const pos = calculatePosition(testStops, 350, [obstacleOnSegment2]);
    expect(pos.state).toBe("running");
    expect(pos.currentStopIndex).toBe(0);
    expect(pos.nextStationCode).toBe("BBB");
    // Crucial: No early delay accumulated on segment 1!
    expect(pos.delayMinutes).toBe(0);
  });

  it("train stops and enters 'blocked' state when it arrives at active blockage", () => {
    const obstacleOnSegment1: Obstacle = {
      id: "obs-1",
      type: "track_blockage",
      title: "Rockfall",
      description: "Rockfall on AAA-BBB",
      locationType: "segment",
      fromStationCode: "AAA",
      toStationCode: "BBB",
      startMinute: 320,
      durationMinutes: 60,
      uncertaintyMinutes: 10,
      effect: "full_block",
    };

    // Segment 1 nominal departure is 305, reach point ~0.45 is ~348.
    // At minute 360, train is inside [320, 380] block window:
    const pos = calculatePosition(testStops, 360, [obstacleOnSegment1]);
    expect(pos.state).toBe("blocked");
    expect(pos.currentSpeedKmph).toBe(0);
    expect(pos.activeObstacleId).toBe("obs-1");
    expect(pos.delayMinutes).toBeGreaterThan(0);
  });

  it("cascades accumulated delay to subsequent stops after obstacle clears", () => {
    const obstacleOnSegment1: Obstacle = {
      id: "obs-1",
      type: "track_blockage",
      title: "Cleared Rockfall",
      description: "Cleared Rockfall",
      locationType: "segment",
      fromStationCode: "AAA",
      toStationCode: "BBB",
      startMinute: 310,
      durationMinutes: 40, // Clears at 350
      uncertaintyMinutes: 5,
      effect: "full_block",
    };

    // At minute 420 (after clearance), train is past the block
    const pos = calculatePosition(testStops, 420, [obstacleOnSegment1]);
    expect(pos.delayMinutes).toBeGreaterThan(0);
    // Delay continues to next segments
    expect(pos.currentMinute).toBe(420);
  });

  it("enforces speed restriction when obstacle effect is speed_restriction", () => {
    const speedLimitObs: Obstacle = {
      id: "obs-spd",
      type: "fog_restriction",
      title: "Fog Caution",
      description: "Fog Caution",
      locationType: "segment",
      fromStationCode: "AAA",
      toStationCode: "BBB",
      startMinute: 300,
      durationMinutes: 120,
      uncertaintyMinutes: 10,
      effect: "speed_restriction",
      speedCapKmph: 30,
    };

    const pos = calculatePosition(testStops, 340, [speedLimitObs]);
    expect(pos.state).toBe("braking");
    expect(pos.currentSpeedKmph).toBe(30);
  });

  it("extends halt time when station dwell obstacle occurs", () => {
    const dwellObs: Obstacle = {
      id: "obs-dwell",
      type: "signal_failure",
      title: "Interlocking Failure",
      description: "Station Dwell Obstacle",
      locationType: "station",
      stationCode: "BBB",
      toStationCode: "BBB",
      startMinute: 390,
      durationMinutes: 30,
      uncertaintyMinutes: 5,
      effect: "station_dwell",
    };

    // Scheduled halt at BBB is 400 to 405. Extended dwell is 30 mins (until 435).
    const pos = calculatePosition(testStops, 415, [dwellObs]);
    expect(pos.state).toBe("dwelling");
    expect(pos.currentStationCode).toBe("BBB");
    expect(pos.activeObstacleId).toBe("obs-dwell");
  });
});
