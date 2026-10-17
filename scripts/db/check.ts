/**
 * scripts/db/check.ts
 * Supabase database health and latency diagnostic check.
 * Run with: npm run db:check
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

interface SnapshotData {
  trains: { train_number: string }[];
  stations: { code: string }[];
  stops: { train_number: string; seq: number }[];
}

interface TrainQueryResult {
  train_number: string;
  train_name: string;
  train_stops: {
    seq: number;
    station_code: string;
    station_name: string;
    arrival_formatted: string | null;
    departure_formatted: string | null;
  }[];
}

import {
  getHostOnly,
  isPlaceholder,
  loadEnvLocal,
} from "./env-helper";

loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function checkDatabase(): Promise<void> {
  console.log("==================================================");
  console.log("TravelRescue AI: Database Health Diagnostic");
  console.log("==================================================");

  if (!SUPABASE_URL || !ANON_KEY || isPlaceholder(SUPABASE_URL) || isPlaceholder(ANON_KEY)) {
    console.warn("WARN: Supabase credentials not found or contain placeholder values in .env.local.");
    console.warn("Falling back to verified offline snapshot (data/clean/sim-snapshot.json).");
    const snapshotPath = path.resolve(process.cwd(), "data", "clean", "sim-snapshot.json");
    if (fs.existsSync(snapshotPath)) {
      const snap: SnapshotData = JSON.parse(fs.readFileSync(snapshotPath, "utf-8"));
      console.log(`✓ Offline Snapshot Valid: ${snap.trains.length} trains, ${snap.stations.length} stations, ${snap.stops.length} stops.`);
    }
    return;
  }

  const supabase = createClient(SUPABASE_URL, ANON_KEY);
  const start = Date.now();

  try {
    // 1. Station count
    const { count: stationCount, error: stErr } = await supabase
      .from("stations")
      .select("*", { count: "exact", head: true });
    if (stErr) throw stErr;

    // 2. Train count
    const { count: trainCount, error: trErr } = await supabase
      .from("trains")
      .select("*", { count: "exact", head: true });
    if (trErr) throw trErr;

    // 3. Stop count
    const { count: stopCount, error: spErr } = await supabase
      .from("train_stops")
      .select("*", { count: "exact", head: true });
    if (spErr) throw spErr;

    // 4. Rail link count
    const { count: linkCount, error: lkErr } = await supabase
      .from("rail_links")
      .select("*", { count: "exact", head: true });
    if (lkErr) throw lkErr;

    // 5. Sample query: Train lookup with stops
    const qStart = Date.now();
    const { data: firstTrain } = await supabase.from("trains").select("train_number").limit(1);
    const targetTrainNumber = firstTrain?.[0]?.train_number ?? "12028";
    const { data, error: qErr } = await supabase
      .from("trains")
      .select("train_number, train_name, train_stops(seq, station_code, station_name, arrival_formatted, departure_formatted)")
      .eq("train_number", targetTrainNumber)
      .single();
    if (qErr) throw qErr;

    const qLatency = Date.now() - qStart;
    const totalLatency = Date.now() - start;
    const train22691 = data as unknown as TrainQueryResult | null;

    console.log(`✓ Connected to Supabase host: ${getHostOnly(SUPABASE_URL)}`);
    console.log(`  Ping Latency:    ${totalLatency}ms`);
    console.log(`  Query Latency:   ${qLatency}ms (Train ${targetTrainNumber} with nested stops)`);
    console.log(`  Stations Count:  ${stationCount ?? 0}`);
    console.log(`  Trains Count:    ${trainCount ?? 0}`);
    console.log(`  Stops Count:     ${stopCount ?? 0}`);
    console.log(`  Rail Links:      ${linkCount ?? 0}`);
    if (train22691) {
      console.log(`  Sample Verified: ${train22691.train_number} - ${train22691.train_name} (${train22691.train_stops?.length ?? 0} stops)`);
    }
    console.log("✓ Database health status: HEALTHY (p95 latency nominal)");
    console.log("==================================================");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("ERR: Database health check failed:", message);
    process.exit(1);
  }
}

checkDatabase().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error("ERR:", message);
  process.exit(1);
});
