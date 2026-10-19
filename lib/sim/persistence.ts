/**
 * lib/sim/persistence.ts
 * Supabase persistence for simulation runs, scenarios, event logs, and telemetry snapshots.
 */

import {
  createScenario,
  getScenarioById,
  getAllScenarios,
  recordSimEvents,
  getSimEvents,
} from "@/lib/data/scenarios";
import {
  getSnapshotPresetScenarios,
  getSnapshotScenarioById,
} from "@/lib/data/snapshot-fallback";
import type { DbSimScenario, DbSimEvent } from "@/lib/data/types";
import type { Obstacle, SimPosition } from "./types";

export interface SimEventRecord {
  tOffsetMs: number;
  kind: "disruption" | "speed_change" | "signal_state" | "reroute" | "departure" | "arrival" | "halt" | "telemetry" | "info";
  payload: Record<string, unknown>;
}

export interface TelemetrySnapshot {
  minute: number;
  tOffsetMs: number;
  distanceKm: number;
  speedKmph: number;
  latitude: number;
  longitude: number;
  state: string;
  delayMinutes: number;
  currentStopIndex: number;
  nextStopIndex: number;
  currentStationCode: string | null;
  nextStationCode: string | null;
  statusMessage: string;
}

export interface SimScenarioRun {
  id?: string;
  name: string;
  createdBy?: string;
  trainNumber: string;
  trainName: string;
  startMinute: number;
  endMinute: number;
  seed: number;
  metadata?: Record<string, unknown>;
  obstacles: Obstacle[];
  events: SimEventRecord[];
  telemetrySnapshots: TelemetrySnapshot[];
  createdAt?: string;
}

// In-memory store for newly saved scenarios when Supabase is unconfigured or in read-only mode
const inMemoryScenarioRuns = new Map<string, SimScenarioRun>();

/**
 * Persist an entire simulation run to Supabase (with resilient in-memory fallback):
 * 1. Inserts scenario metadata, train number, initial state, seed, and obstacles.
 * 2. Batches and inserts timestamped events and telemetry snapshots into sim_events.
 */
export async function saveScenarioRun(run: SimScenarioRun): Promise<{ scenarioId: string; eventsCount: number } | null> {
  const scenarioPayload: Omit<DbSimScenario, "id" | "created_at"> = {
    name: run.name,
    created_by: run.createdBy || "dispatcher",
    train_number: run.trainNumber,
    route_id: null,
    initial_state: {
      trainName: run.trainName,
      startMinute: run.startMinute,
      endMinute: run.endMinute,
      seed: run.seed,
      metadata: run.metadata || {},
    },
    obstacles: run.obstacles as unknown[],
  };

  try {
    const created = await createScenario(scenarioPayload);
    if (created && created.id) {
      const scenarioId = created.id;

      // Convert events to DbSimEvent records
      const dbEvents: Array<Omit<DbSimEvent, "id" | "created_at">> = run.events.map((e) => ({
        scenario_id: scenarioId,
        t_offset_ms: e.tOffsetMs,
        kind: e.kind,
        payload: e.payload,
      }));

      // Convert telemetry snapshots to DbSimEvent records of kind 'telemetry'
      const dbTelemetry: Array<Omit<DbSimEvent, "id" | "created_at">> = run.telemetrySnapshots.map((t) => ({
        scenario_id: scenarioId,
        t_offset_ms: t.tOffsetMs,
        kind: "telemetry",
        payload: {
          minute: t.minute,
          distanceKm: t.distanceKm,
          speedKmph: t.speedKmph,
          latitude: t.latitude,
          longitude: t.longitude,
          state: t.state,
          delayMinutes: t.delayMinutes,
          currentStopIndex: t.currentStopIndex,
          nextStopIndex: t.nextStopIndex,
          currentStationCode: t.currentStationCode,
          nextStationCode: t.nextStationCode,
          statusMessage: t.statusMessage,
        },
      }));

      // Batch insert all events in chunks of 100 to avoid payload size limits
      const allEvents = [...dbEvents, ...dbTelemetry];
      let totalSaved = 0;
      const chunkSize = 100;

      for (let i = 0; i < allEvents.length; i += chunkSize) {
        const chunk = allEvents.slice(i, i + chunkSize);
        const count = await recordSimEvents(chunk);
        totalSaved += count;
      }

      return {
        scenarioId,
        eventsCount: totalSaved,
      };
    }
  } catch (err) {
    console.warn("Supabase scenario save failed, using local in-memory fallback:", err);
  }

  // Graceful fallback: store in local in-memory map
  const fallbackId = `local-run-${Date.now()}`;
  inMemoryScenarioRuns.set(fallbackId, {
    ...run,
    id: fallbackId,
    createdAt: new Date().toISOString(),
  });

  return {
    scenarioId: fallbackId,
    eventsCount: run.events.length + run.telemetrySnapshots.length,
  };
}

/**
 * Load a past scenario run and all its events & telemetry snapshots from Supabase (or fallback presets).
 */
export async function loadScenarioRun(scenarioId: string): Promise<SimScenarioRun | null> {
  // Check in-memory store first
  if (inMemoryScenarioRuns.has(scenarioId)) {
    return inMemoryScenarioRuns.get(scenarioId) || null;
  }

  // Check built-in preset replay scenarios
  const preset = getSnapshotScenarioById(scenarioId);
  if (preset) {
    return preset;
  }

  try {
    const scenario = await getScenarioById(scenarioId);
    if (!scenario) return null;

    const rawEvents = await getSimEvents(scenarioId);

    const events: SimEventRecord[] = [];
    const telemetrySnapshots: TelemetrySnapshot[] = [];

    for (const ev of rawEvents) {
      if (ev.kind === "telemetry") {
        const p = ev.payload as Record<string, unknown>;
        telemetrySnapshots.push({
          minute: (p.minute as number) ?? 0,
          tOffsetMs: ev.t_offset_ms,
          distanceKm: (p.distanceKm as number) ?? 0,
          speedKmph: (p.speedKmph as number) ?? 0,
          latitude: (p.latitude as number) ?? 0,
          longitude: (p.longitude as number) ?? 0,
          state: (p.state as string) ?? "running",
          delayMinutes: (p.delayMinutes as number) ?? 0,
          currentStopIndex: (p.currentStopIndex as number) ?? 0,
          nextStopIndex: (p.nextStopIndex as number) ?? 1,
          currentStationCode: (p.currentStationCode as string) ?? null,
          nextStationCode: (p.nextStationCode as string) ?? null,
          statusMessage: (p.statusMessage as string) ?? "",
        });
      } else {
        events.push({
          tOffsetMs: ev.t_offset_ms,
          kind: ev.kind as SimEventRecord["kind"],
          payload: ev.payload,
        });
      }
    }

    const initState = (scenario.initial_state || {}) as Record<string, unknown>;

    return {
      id: scenario.id,
      name: scenario.name,
      createdBy: scenario.created_by,
      trainNumber: scenario.train_number || "",
      trainName: (initState.trainName as string) || "Train",
      startMinute: (initState.startMinute as number) ?? 360,
      endMinute: (initState.endMinute as number) ?? 1200,
      seed: (initState.seed as number) ?? 42,
      metadata: (initState.metadata as Record<string, unknown>) || {},
      obstacles: (scenario.obstacles || []) as Obstacle[],
      events,
      telemetrySnapshots,
      createdAt: scenario.created_at,
    };
  } catch (err) {
    console.warn(`Supabase loadScenarioRun (${scenarioId}) failed:`, err);
    return null;
  }
}

/**
 * List saved scenarios with high-level summary metadata.
 */
export async function listSavedScenarios(limit = 20): Promise<Array<{
  id: string;
  name: string;
  trainNumber: string;
  createdAt: string;
  obstacleCount: number;
}>> {
  const list: Array<{
    id: string;
    name: string;
    trainNumber: string;
    createdAt: string;
    obstacleCount: number;
  }> = [];

  // Add any in-memory runs
  for (const [id, r] of inMemoryScenarioRuns.entries()) {
    list.push({
      id,
      name: r.name,
      trainNumber: r.trainNumber || "Unknown",
      createdAt: r.createdAt || new Date().toISOString(),
      obstacleCount: r.obstacles?.length || 0,
    });
  }

  try {
    const dbScenarios = await getAllScenarios(limit);
    if (dbScenarios && dbScenarios.length > 0) {
      for (const s of dbScenarios) {
        list.push({
          id: s.id,
          name: s.name,
          trainNumber: s.train_number || "Unknown",
          createdAt: s.created_at || new Date().toISOString(),
          obstacleCount: Array.isArray(s.obstacles) ? s.obstacles.length : 0,
        });
      }
    }
  } catch (err) {
    console.warn("Supabase listSavedScenarios failed, returning preset scenarios:", err);
  }

  // If no DB scenarios or offline, guarantee pre-seeded snapshot replay scenarios are available
  if (list.length === 0) {
    const presets = getSnapshotPresetScenarios();
    return presets.map((p) => ({
      id: p.id || "preset",
      name: p.name,
      trainNumber: p.trainNumber,
      createdAt: p.createdAt || new Date().toISOString(),
      obstacleCount: p.obstacles.length,
    }));
  }

  return list.slice(0, limit);
}

/**
 * Helper to construct a TelemetrySnapshot from current SimPosition
 */
export function createTelemetrySnapshot(position: SimPosition, tOffsetMs: number): TelemetrySnapshot {
  return {
    minute: position.currentMinute,
    tOffsetMs,
    distanceKm: position.distanceKm,
    speedKmph: position.currentSpeedKmph,
    latitude: position.latitude,
    longitude: position.longitude,
    state: position.state,
    delayMinutes: position.delayMinutes,
    currentStopIndex: position.currentStopIndex,
    nextStopIndex: position.nextStopIndex,
    currentStationCode: position.currentStationCode,
    nextStationCode: position.nextStationCode,
    statusMessage: position.statusMessage,
  };
}
