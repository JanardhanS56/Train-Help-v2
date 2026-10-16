/**
 * lib/journeys/data-provider.ts
 * Unified data provider for trains, stops, and schedules.
 * Accesses Supabase when configured, with seamless in-memory fallback to clean data files
 * for zero-network reliability, test suites, and sub-millisecond local queries.
 */

import * as fs from "fs";
import * as path from "path";
import { getSupabaseClient } from "@/lib/data/supabase-client";
import type { DbTrain, DbTrainStop, TrainWithStops } from "@/lib/data/types";

let memoryTrains: DbTrain[] | null = null;
let memoryStops: DbTrainStop[] | null = null;
let memoryTrainMap: Map<string, TrainWithStops> | null = null;

function loadLocalCleanData(): { trains: DbTrain[]; stops: DbTrainStop[] } {
  if (memoryTrains && memoryStops) {
    return { trains: memoryTrains, stops: memoryStops };
  }

  try {
    const cleanDir = path.resolve(process.cwd(), "data", "clean");
    const trainsPath = path.join(cleanDir, "trains.json");
    const stopsPath = path.join(cleanDir, "train_stops.json");

    if (fs.existsSync(trainsPath) && fs.existsSync(stopsPath)) {
      memoryTrains = JSON.parse(fs.readFileSync(trainsPath, "utf-8")) as DbTrain[];
      memoryStops = JSON.parse(fs.readFileSync(stopsPath, "utf-8")) as DbTrainStop[];
      return { trains: memoryTrains, stops: memoryStops };
    }
  } catch (err) {
    console.warn("Failed to read local clean train data files:", err);
  }

  return { trains: [], stops: [] };
}

/**
 * Returns a map of train_number -> TrainWithStops (with sorted stops).
 */
export async function getTrainDataset(): Promise<Map<string, TrainWithStops>> {
  if (memoryTrainMap && memoryTrainMap.size > 0) {
    return memoryTrainMap;
  }

  // First try Supabase if connected
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data: trainsData, error: trainsErr } = await supabase
        .from("trains")
        .select("*")
        .limit(500);

      const { data: stopsData, error: stopsErr } = await supabase
        .from("train_stops")
        .select("*")
        .order("seq", { ascending: true })
        .limit(10000);

      if (!trainsErr && !stopsErr && trainsData && stopsData && trainsData.length > 0) {
        const map = new Map<string, TrainWithStops>();
        for (const t of trainsData as DbTrain[]) {
          map.set(t.train_number, { ...t, stops: [] });
        }
        for (const s of stopsData as DbTrainStop[]) {
          const t = map.get(s.train_number);
          if (t) {
            t.stops.push(s);
          }
        }
        for (const t of map.values()) {
          t.stops.sort((a, b) => a.seq - b.seq);
        }
        memoryTrainMap = map;
        return memoryTrainMap;
      }
    } catch {
      // Fallback to local files
    }
  }

  // Fallback to local verified clean dataset
  const { trains, stops } = loadLocalCleanData();
  const map = new Map<string, TrainWithStops>();

  for (const t of trains) {
    map.set(t.train_number, { ...t, stops: [] });
  }

  for (const s of stops) {
    const t = map.get(s.train_number);
    if (t) {
      t.stops.push(s);
    }
  }

  for (const t of map.values()) {
    t.stops.sort((a, b) => a.seq - b.seq);
  }

  memoryTrainMap = map;
  return memoryTrainMap;
}

/**
 * Reset memory cache (useful in test suites).
 */
export function clearTrainDatasetCache(): void {
  memoryTrains = null;
  memoryStops = null;
  memoryTrainMap = null;
}
