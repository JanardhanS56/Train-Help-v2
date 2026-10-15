/**
 * lib/sim/__tests__/sim-persistence.test.ts
 * Unit tests for simulation persistence, deterministic replay session, and disruption bridging.
 */

import { describe, it, expect, vi } from "vitest";
import {
  saveScenarioRun,
  loadScenarioRun,
  listSavedScenarios,
  createTelemetrySnapshot,
  type SimScenarioRun,
  type TelemetrySnapshot,
} from "../persistence";
import {
  SimReplaySession,
  interpolateReplayPosition,
  getActiveObstacleAtMinute,
  getReplayEventsUpToMinute,
} from "../replay";
import { mapObstacleToSeverity, publishSimDisruption, clearSimDisruption } from "../disruption-bridge";
import type { Obstacle, SimPosition } from "../types";

// Mock Supabase data access layer for unit test isolation
vi.mock("@/lib/data/scenarios", () => {
  const store = new Map<string, Record<string, unknown>>();
  const eventStore = new Map<string, Array<Record<string, unknown>>>();

  return {
    createScenario: vi.fn(async (scenario) => {
      const id = "mock-scenario-uuid-1234";
      const record = { ...scenario, id, created_at: "2026-10-15T12:00:00Z" };
      store.set(id, record);
      return record;
    }),
    getScenarioById: vi.fn(async (id) => store.get(id) || null),
    getAllScenarios: vi.fn(async () => Array.from(store.values())),
    recordSimEvents: vi.fn(async (events) => {
      if (events.length === 0) return 0;
      const scenarioId = events[0].scenario_id;
      const existing = eventStore.get(scenarioId) || [];
      eventStore.set(scenarioId, [...existing, ...events]);
      return events.length;
    }),
    getSimEvents: vi.fn(async (scenarioId) => eventStore.get(scenarioId) || []),
  };
});

vi.mock("@/lib/data/disruptions", () => {
  const disruptions = new Map<string, Record<string, unknown>>();

  return {
    createDisruption: vi.fn(async (d) => {
      const id = "mock-disruption-uuid-999";
      const record = { ...d, id, created_at: "2026-10-15T12:00:00Z" };
      disruptions.set(id, record);
      return record;
    }),
    resolveDisruption: vi.fn(async (id) => {
      const existing = disruptions.get(id);
      if (existing) {
        existing.resolved_at = "2026-10-15T12:30:00Z";
        return true;
      }
      return false;
    }),
  };
});

describe("Simulation Persistence Engine", () => {
  const sampleObstacle: Obstacle = {
    id: "obs-landslide-1",
    type: "track_blockage",
    title: "Konkan Landslide",
    description: "Debris on track between Chiplun and Ratnagiri",
    locationType: "segment",
    fromStationCode: "CHI",
    toStationCode: "RN",
    startMinute: 400,
    durationMinutes: 120,
    uncertaintyMinutes: 15,
    effect: "full_block",
  };

  const samplePosition: SimPosition = {
    currentMinute: 390,
    state: "running",
    latitude: 17.532,
    longitude: 73.518,
    distanceKm: 250,
    currentSpeedKmph: 95,
    maxSpeedKmph: 110,
    currentStopIndex: 2,
    nextStopIndex: 3,
    currentStationCode: "CHI",
    nextStationCode: "RN",
    delayMinutes: 0,
    activeObstacleId: null,
    statusMessage: "Running at line speed",
  };

  it("creates a telemetry snapshot correctly from a SimPosition", () => {
    const snapshot = createTelemetrySnapshot(samplePosition, 10000);
    expect(snapshot.minute).toBe(390);
    expect(snapshot.speedKmph).toBe(95);
    expect(snapshot.state).toBe("running");
    expect(snapshot.distanceKm).toBe(250);
  });

  it("persists a scenario run with initial conditions, events, and telemetry snapshots", async () => {
    const run: SimScenarioRun = {
      name: "Chiplun Landslide Divert Test",
      createdBy: "dispatcher_1",
      trainNumber: "16595",
      trainName: "Panchaganga Express",
      startMinute: 360,
      endMinute: 800,
      seed: 1337,
      metadata: { weather: "Heavy Monsoon", section: "Konkan Railway" },
      obstacles: [sampleObstacle],
      events: [
        {
          tOffsetMs: 5000,
          kind: "disruption",
          payload: { title: "Landslide Injected", minute: 400 },
        },
      ],
      telemetrySnapshots: [
        createTelemetrySnapshot(samplePosition, 10000),
        createTelemetrySnapshot({ ...samplePosition, currentMinute: 420, distanceKm: 280 }, 20000),
      ],
    };

    const saved = await saveScenarioRun(run);
    expect(saved).not.toBeNull();
    expect(saved?.scenarioId).toBe("mock-scenario-uuid-1234");
    expect(saved?.eventsCount).toBe(3); // 1 event + 2 telemetry snapshots

    const loaded = await loadScenarioRun(saved!.scenarioId);
    expect(loaded).not.toBeNull();
    expect(loaded?.name).toBe("Chiplun Landslide Divert Test");
    expect(loaded?.trainNumber).toBe("16595");
    expect(loaded?.seed).toBe(1337);
    expect(loaded?.obstacles).toHaveLength(1);
    expect(loaded?.events).toHaveLength(1);
    expect(loaded?.telemetrySnapshots).toHaveLength(2);

    const summaries = await listSavedScenarios();
    expect(summaries.length).toBeGreaterThanOrEqual(1);
    expect(summaries[0].trainNumber).toBe("16595");
  });
});

describe("Deterministic Replay Engine", () => {
  const snapshots: TelemetrySnapshot[] = [
    {
      minute: 360,
      tOffsetMs: 0,
      distanceKm: 0,
      speedKmph: 0,
      latitude: 13.0,
      longitude: 77.0,
      state: "scheduled",
      delayMinutes: 0,
      currentStopIndex: 0,
      nextStopIndex: 1,
      currentStationCode: "SBC",
      nextStationCode: "YPR",
      statusMessage: "Origin Terminal",
    },
    {
      minute: 400,
      tOffsetMs: 40000,
      distanceKm: 50,
      speedKmph: 100,
      latitude: 13.5,
      longitude: 77.5,
      state: "running",
      delayMinutes: 5,
      currentStopIndex: 1,
      nextStopIndex: 2,
      currentStationCode: "YPR",
      nextStationCode: "TK",
      statusMessage: "Cruising",
    },
  ];

  const obstacles: Obstacle[] = [
    {
      id: "obs-fog-1",
      type: "fog_restriction",
      title: "Dense Fog",
      description: "Visibility < 50m",
      locationType: "station",
      stationCode: "TK",
      startMinute: 380,
      durationMinutes: 60,
      uncertaintyMinutes: 10,
      effect: "speed_restriction",
    },
  ];

  it("interpolates coordinates smoothly between snapshots", () => {
    // Exactly halfway: minute 380
    const interpolated = interpolateReplayPosition(snapshots, 380);
    expect(interpolated.latitude).toBeCloseTo(13.25, 2);
    expect(interpolated.longitude).toBeCloseTo(77.25, 2);
    expect(interpolated.distanceKm).toBeCloseTo(25, 1);
    expect(interpolated.currentSpeedKmph).toBe(50);
  });

  it("identifies active obstacles at a specific minute", () => {
    expect(getActiveObstacleAtMinute(obstacles, 370)).toBeNull();
    const active = getActiveObstacleAtMinute(obstacles, 410);
    expect(active).not.toBeNull();
    expect(active?.id).toBe("obs-fog-1");
    expect(getActiveObstacleAtMinute(obstacles, 450)).toBeNull();
  });

  it("filters replay events up to the current virtual minute", () => {
    const events = [
      { tOffsetMs: 0, kind: "departure" as const, payload: { minute: 360, title: "Departed" } },
      { tOffsetMs: 1200000, kind: "speed_change" as const, payload: { minute: 380, speedMultiplier: 5 } },
      { tOffsetMs: 3600000, kind: "arrival" as const, payload: { minute: 420, title: "Arrived" } },
    ];

    const upTo370 = getReplayEventsUpToMinute(events, 360, 370);
    expect(upTo370).toHaveLength(1);

    const upTo400 = getReplayEventsUpToMinute(events, 360, 400);
    expect(upTo400).toHaveLength(2);
  });

  it("plays, scrubs, and steps deterministically at 1x, 2x, and 5x speeds", () => {
    const run: SimScenarioRun = {
      name: "Replay Test",
      trainNumber: "12627",
      trainName: "Karnataka Express",
      startMinute: 360,
      endMinute: 420,
      seed: 42,
      obstacles,
      events: [],
      telemetrySnapshots: snapshots,
    };

    const session = new SimReplaySession(run);
    expect(session.getCurrentMinute()).toBe(360);
    expect(session.getIsPlaying()).toBe(false);

    // Test 1x speed step
    session.setSpeed(1);
    session.play();
    expect(session.getIsPlaying()).toBe(true);
    // 60 seconds at 1x = 1 simulation minute
    session.step(60);
    expect(session.getCurrentMinute()).toBeCloseTo(361, 2);

    // Test 2x speed step
    session.setSpeed(2);
    // 60 seconds at 2x = 2 simulation minutes
    session.step(60);
    expect(session.getCurrentMinute()).toBeCloseTo(363, 2);

    // Test 5x speed step
    session.setSpeed(5);
    // 60 seconds at 5x = 5 simulation minutes
    session.step(60);
    expect(session.getCurrentMinute()).toBeCloseTo(368, 2);

    // Test scrub
    session.scrub(400);
    expect(session.getCurrentMinute()).toBe(400);
    const state = session.getState();
    expect(state.position.currentSpeedKmph).toBe(100);
    expect(state.activeObstacle?.id).toBe("obs-fog-1");
  });
});

describe("Simulator Disruption Bridge", () => {
  it("maps obstacle severity properly based on duration and effect", () => {
    const blockingObs: Obstacle = {
      id: "1",
      type: "track_blockage",
      title: "Block",
      description: "Full block",
      locationType: "segment",
      startMinute: 100,
      durationMinutes: 30,
      uncertaintyMinutes: 5,
      effect: "full_block",
    };
    expect(mapObstacleToSeverity(blockingObs)).toBe("CRITICAL");

    const mildObs: Obstacle = {
      id: "2",
      type: "medical_emergency",
      title: "Medical Halt",
      description: "Passenger aid",
      locationType: "station",
      stationCode: "BPL",
      startMinute: 100,
      durationMinutes: 15,
      uncertaintyMinutes: 5,
      effect: "station_dwell",
    };
    expect(mapObstacleToSeverity(mildObs)).toBe("LOW");
  });

  it("publishes and clears active disruptions in Supabase", async () => {
    const obs: Obstacle = {
      id: "obs-bridge-1",
      type: "ohe_failure",
      title: "OHE Wire Snap",
      description: "Overhead power line snapped",
      locationType: "station",
      stationCode: "BPL",
      startMinute: 200,
      durationMinutes: 90,
      uncertaintyMinutes: 15,
      effect: "station_dwell",
    };

    const disruptionId = await publishSimDisruption(obs, "22691");
    expect(disruptionId).toBe("mock-disruption-uuid-999");

    const resolved = await clearSimDisruption(disruptionId!);
    expect(resolved).toBe(true);
  });
});
