/**
 * lib/sim/disruption-bridge.ts
 * Bridges simulator obstacles directly into the Supabase disruptions table
 * so TravelRescue passenger UI and notification feeds reflect live simulation events.
 */

import { createDisruption, resolveDisruption } from "@/lib/data/disruptions";
import type { DbDisruption } from "@/lib/data/types";
import type { Obstacle } from "./types";

/**
 * Maps obstacle severity from duration and effect.
 */
export function mapObstacleToSeverity(obstacle: Obstacle): DbDisruption["severity"] {
  if (obstacle.effect === "full_block" || obstacle.durationMinutes >= 180) {
    return "CRITICAL";
  }
  if (obstacle.durationMinutes >= 60) {
    return "MODERATE";
  }
  return "LOW";
}

/**
 * Publishes an active simulation obstacle to the Supabase disruptions table.
 * Returns the generated disruption ID, or null if database was unavailable.
 */
export async function publishSimDisruption(
  obstacle: Obstacle,
  trainNumber?: string
): Promise<string | null> {
  const stationCode = obstacle.stationCode || obstacle.fromStationCode || null;
  const severity = mapObstacleToSeverity(obstacle);

  const desc = trainNumber
    ? `${obstacle.title}: ${obstacle.description} (Affecting train ${trainNumber})`
    : `${obstacle.title}: ${obstacle.description}`;

  const disruptionPayload: Omit<DbDisruption, "id" | "created_at"> = {
    trip_id: null,
    route_id: null,
    station_code: stationCode,
    type: obstacle.type,
    severity,
    description: desc,
    started_at: new Date().toISOString(),
    resolved_at: null,
    source: "sim",
  };

  const created = await createDisruption(disruptionPayload);
  return created ? created.id : null;
}

/**
 * Marks a previously published simulation disruption as resolved in Supabase.
 */
export async function clearSimDisruption(disruptionId: string): Promise<boolean> {
  if (!disruptionId) return false;
  return resolveDisruption(disruptionId);
}
