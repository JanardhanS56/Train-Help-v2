/**
 * scripts/db/seed.ts
 * Idempotent batch seed script for Supabase PostgreSQL.
 * Reads cleaned datasets from data/clean/ and upserts into database.
 * Run with: npm run db:seed
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

interface CleanStation {
  code: string;
  name: string;
  state: string;
  zone: string;
  lat: number;
  lng: number;
  is_junction: boolean;
  route_count: number;
}

interface CleanTrain {
  train_number: string;
  train_name: string;
  train_type: string;
  railway_zone: string;
  origin_station_code: string;
  destination_station_code: string;
  origin_name: string;
  destination_name: string;
  days_running: string[];
  total_distance_km: number;
  total_duration_min: number;
  stops_count: number;
  has_official_timing: boolean;
}

interface CleanStop {
  train_number: string;
  seq: number;
  station_code: string;
  station_name: string;
  arrival_min: number | null;
  departure_min: number | null;
  arrival_formatted: string | null;
  departure_formatted: string | null;
  day_offset: number;
  distance_km: number;
  halt_min: number;
  time_source: "official" | "derived";
}

interface CleanLink {
  station_a: string;
  station_b: string;
  distance_km: number;
  typical_duration_min: number;
  traversals: number;
}

interface StationRow {
  code: string;
  name: string;
  state: string;
  zone: string;
  latitude: number;
  longitude: number;
  is_junction: boolean;
  route_count: number;
}

interface TrainRow {
  train_number: string;
  train_name: string;
  train_type: string;
  railway_zone: string;
  origin_station_code: string;
  destination_station_code: string;
  origin_name: string;
  destination_name: string;
  days_running: string[];
  total_distance_km: number;
  total_duration_min: number;
  stops_count: number;
  has_official_timing: boolean;
}

interface TrainStopRow {
  train_number: string;
  seq: number;
  station_code: string;
  station_name: string;
  arrival_min: number | null;
  departure_min: number | null;
  arrival_formatted: string | null;
  departure_formatted: string | null;
  day_offset: number;
  distance_km: number;
  halt_min: number;
  time_source: "official" | "derived";
}

interface RailLinkRow {
  station_a: string;
  station_b: string;
  distance_km: number;
  typical_duration_min: number;
  traversals: number;
}

import {
  assertValidSecret,
  getHostOnly,
  loadEnvLocal,
  maskSecret,
} from "./env-helper";

loadEnvLocal();

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const rawServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let SUPABASE_URL: string;
let SERVICE_KEY: string;

try {
  SUPABASE_URL = assertValidSecret(
    "NEXT_PUBLIC_SUPABASE_URL",
    rawUrl,
    "Ensure NEXT_PUBLIC_SUPABASE_URL is set in .env.local and is not a placeholder."
  );
  SERVICE_KEY = assertValidSecret(
    "SUPABASE_SERVICE_ROLE_KEY",
    rawServiceKey,
    "Ensure SUPABASE_SERVICE_ROLE_KEY is set in .env.local and is not a placeholder. (Local seed/migration scripts only)."
  );
} catch (err: unknown) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

type UpsertPayload = Parameters<ReturnType<typeof supabase.from>["upsert"]>[0];

async function batchUpsert(
  table: string,
  records: Record<string, unknown>[],
  batchSize: number,
  onConflict: string
): Promise<void> {
  console.log(`Upserting ${records.length} records into '${table}' in batches of ${batchSize}...`);
  let inserted = 0;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const { error } = await supabase.from(table).upsert(batch as unknown as UpsertPayload, { onConflict });
    if (error) {
      console.error(`ERR: batch upsert failed on '${table}' at offset ${i}:`, error.message);
      throw error;
    }
    inserted += batch.length;
    process.stdout.write(`  [${table}] ${inserted}/${records.length} (${Math.round((inserted / records.length) * 100)}%)\r`);
  }
  console.log(`\n✓ '${table}' complete: ${inserted} records verified.`);
}

async function runSeed(): Promise<void> {
  const startTime = Date.now();
  console.log("==================================================");
  console.log("TravelRescue AI: Seeding Supabase Database");
  console.log(`Target Project Host: ${getHostOnly(SUPABASE_URL)}`);
  console.log(`Service Key:         ${maskSecret(SERVICE_KEY)}`);
  console.log("==================================================");

  const cleanDir = path.resolve(process.cwd(), "data", "clean");
  const stations: CleanStation[] = JSON.parse(fs.readFileSync(path.join(cleanDir, "stations.json"), "utf-8"));
  const trains: CleanTrain[] = JSON.parse(fs.readFileSync(path.join(cleanDir, "trains.json"), "utf-8"));
  const stops: CleanStop[] = JSON.parse(fs.readFileSync(path.join(cleanDir, "train_stops.json"), "utf-8"));
  const links: CleanLink[] = JSON.parse(fs.readFileSync(path.join(cleanDir, "rail_links.json"), "utf-8"));

  // 1. Stations
  const stationRows: (StationRow & Record<string, unknown>)[] = stations.map((s) => ({
    code: s.code,
    name: s.name,
    state: s.state,
    zone: s.zone,
    latitude: s.lat,
    longitude: s.lng,
    is_junction: s.is_junction,
    route_count: s.route_count,
  }));
  await batchUpsert("stations", stationRows, 200, "code");

  // 2. Trains
  const trainRows: (TrainRow & Record<string, unknown>)[] = trains.map((t) => ({
    train_number: t.train_number,
    train_name: t.train_name,
    train_type: t.train_type,
    railway_zone: t.railway_zone,
    origin_station_code: t.origin_station_code,
    destination_station_code: t.destination_station_code,
    origin_name: t.origin_name,
    destination_name: t.destination_name,
    days_running: t.days_running,
    total_distance_km: t.total_distance_km,
    total_duration_min: t.total_duration_min,
    stops_count: t.stops_count,
    has_official_timing: t.has_official_timing,
  }));
  await batchUpsert("trains", trainRows, 100, "train_number");

  // 3. Train Stops
  const stopRows: (TrainStopRow & Record<string, unknown>)[] = stops.map((s) => ({
    train_number: s.train_number,
    seq: s.seq,
    station_code: s.station_code,
    station_name: s.station_name,
    arrival_min: s.arrival_min,
    departure_min: s.departure_min,
    arrival_formatted: s.arrival_formatted,
    departure_formatted: s.departure_formatted,
    day_offset: s.day_offset,
    distance_km: s.distance_km,
    halt_min: s.halt_min,
    time_source: s.time_source,
  }));
  await batchUpsert("train_stops", stopRows, 500, "train_number,seq");

  // 4. Rail Links
  const linkRows: (RailLinkRow & Record<string, unknown>)[] = links.map((l) => ({
    station_a: l.station_a,
    station_b: l.station_b,
    distance_km: l.distance_km,
    typical_duration_min: l.typical_duration_min,
    traversals: l.traversals,
  }));
  await batchUpsert("rail_links", linkRows, 200, "station_a,station_b");

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log("==================================================");
  console.log(`✓ Database seeding completed in ${durationSec}s`);
  console.log(`  Stations:   ${stationRows.length}`);
  console.log(`  Trains:     ${trainRows.length}`);
  console.log(`  Stops:      ${stopRows.length}`);
  console.log(`  Rail Links: ${linkRows.length}`);
  console.log("==================================================");
}

runSeed().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error("FATAL: Seed script failed:", message);
  process.exit(1);
});
