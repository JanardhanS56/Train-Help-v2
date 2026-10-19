import { describe, it, expect } from "vitest";
import {
  getSnapshotTrains,
  getSnapshotTrainByNumber,
  getSnapshotStations,
  getSnapshotRailLinks,
  getSnapshotPresetScenarios,
  getSnapshotScenarioById,
} from "@/lib/data/snapshot-fallback";
import { OBSTACLE_PRESETS } from "@/lib/sim/obstacles";
import { expandSchedule } from "@/lib/sim/schedule";
import { calculatePosition } from "@/lib/sim/movement";
import { generateCandidatePlans } from "@/lib/sim/planner";
import { listSavedScenarios, loadScenarioRun, saveScenarioRun } from "@/lib/sim/persistence";

describe("1-Click Demo Simulation Zero-Network Resilience", () => {
  it("provides full offline train directory without network", () => {
    const trains = getSnapshotTrains();
    expect(trains.length).toBeGreaterThanOrEqual(15);

    const rajdhani = trains.find((t) => t.train_number === "22691");
    expect(rajdhani).toBeDefined();
    expect(rajdhani?.train_name).toContain("Rajdhani");
  });

  it("retrieves 22691 (flagship demo train) with verified stop coordinates", () => {
    const train = getSnapshotTrainByNumber("22691");
    expect(train).not.toBeNull();
    expect(train!.train_number).toBe("22691");
    expect(train!.stops.length).toBeGreaterThan(10);

    for (const stop of train!.stops) {
      expect(typeof stop.latitude).toBe("number");
      expect(typeof stop.longitude).toBe("number");
      expect(stop.latitude).not.toBe(0);
      expect(stop.longitude).not.toBe(0);
    }
  });

  it("retrieves 12051 (Mao Jan Shatabdi) with CHI and RN coordinates for landslide demo", () => {
    const train = getSnapshotTrainByNumber("12051");
    expect(train).not.toBeNull();
    const chi = train!.stops.find((s) => s.station_code === "CHI");
    const rn = train!.stops.find((s) => s.station_code === "RN");
    expect(chi).toBeDefined();
    expect(rn).toBeDefined();
    expect(chi!.departure_min).toBeLessThan(rn!.arrival_min!);
  });

  it("retrieves 12627 (Karnataka Express) with AGC and MTJ coordinates for fog demo", () => {
    const train = getSnapshotTrainByNumber("12627");
    expect(train).not.toBeNull();
    const agc = train!.stops.find((s) => s.station_code === "AGC");
    const mtj = train!.stops.find((s) => s.station_code === "MTJ");
    expect(agc).toBeDefined();
    expect(mtj).toBeDefined();
    expect(agc!.departure_min).toBeLessThan(mtj!.arrival_min!);
  });

  it("simulates kinematics seamlessly through the flagship 1-click obstacle", () => {
    const train = getSnapshotTrainByNumber("22691")!;
    const expanded = expandSchedule(train);
    const demoPreset = OBSTACLE_PRESETS.find((p) => p.id === "preset-1click-demo")!;
    expect(demoPreset).toBeDefined();

    // 10 minutes before the obstacle starts
    const beforePos = calculatePosition(expanded, 1205, [demoPreset.obstacle], train.train_type);
    expect(beforePos.state).toBe("running");

    // During the obstacle blockage
    const duringPos = calculatePosition(expanded, 1220, [demoPreset.obstacle], train.train_type);
    expect(duringPos.state).toBe("blocked");
    expect(duringPos.activeObstacleId).toBe(demoPreset.obstacle.id);
  });

  it("generates deterministic multi-criteria rerouting plans for the 1-click demo without network", () => {
    const train = getSnapshotTrainByNumber("22691")!;
    const links = getSnapshotRailLinks();
    const demoPreset = OBSTACLE_PRESETS.find((p) => p.id === "preset-1click-demo")!;

    const pos = {
      currentMinute: 1220,
      state: "blocked" as const,
      latitude: 22.8,
      longitude: 77.7,
      distanceKm: 1140,
      currentSpeedKmph: 0,
      maxSpeedKmph: 120,
      currentStopIndex: 10,
      nextStopIndex: 11,
      currentStationCode: null,
      nextStationCode: "BPL",
      delayMinutes: 20,
      activeObstacleId: demoPreset.obstacle.id,
      statusMessage: "BLOCKED",
    };

    const plans = generateCandidatePlans(train, pos, demoPreset.obstacle, links);
    expect(plans.length).toBeGreaterThanOrEqual(3);

    const recommended = plans.find((p) => p.recommended);
    expect(recommended).toBeDefined();
    expect(recommended!.confidence).toBeGreaterThan(70);
    expect(recommended!.reasoning.length).toBeGreaterThan(0);
  });

  it("guarantees replay scenarios are available without active database", async () => {
    const scenarios = await listSavedScenarios();
    expect(scenarios.length).toBeGreaterThanOrEqual(3);

    const first = scenarios[0];
    const loaded = await loadScenarioRun(first.id);
    expect(loaded).not.toBeNull();
    expect(loaded!.trainNumber).toBeDefined();
    expect(loaded!.events.length).toBeGreaterThan(0);
  });

  it("allows saving a simulation run gracefully even if database is offline", async () => {
    const runPayload = {
      name: "Offline Test Run",
      trainNumber: "22691",
      trainName: "Rajdhani Exp",
      startMinute: 1195,
      endMinute: 1585,
      seed: 42,
      obstacles: [],
      events: [],
      telemetrySnapshots: [],
    };

    const res = await saveScenarioRun(runPayload);
    expect(res).not.toBeNull();
    expect(res!.scenarioId).toBeDefined();

    // Verify it can be loaded back
    const reloaded = await loadScenarioRun(res!.scenarioId);
    expect(reloaded).not.toBeNull();
    expect(reloaded!.name).toBe("Offline Test Run");
  });
});
