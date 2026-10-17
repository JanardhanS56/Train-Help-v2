/**
 * scripts/db/seed-dev.ts
 * Idempotent developer seed script for TravelRescue AI.
 * Seeds a minimum realistic test dataset:
 * - 10 stations
 * - 5 trains + train stops
 * - 3 routes
 * - 20 schedules
 * - Sample trips & disruption for end-to-end testing
 * 
 * Run with: npm run seed:dev
 */

import { createClient } from "@supabase/supabase-js";

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
    "seed:dev requires SUPABASE_SERVICE_ROLE_KEY to bypass Row Level Security. Falling back to ANON_KEY is disabled to prevent silent write failures."
  );
} catch (err: unknown) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

type UpsertPayload = Parameters<ReturnType<typeof supabase.from>["upsert"]>[0];

async function seedDevDatabase(): Promise<void> {
  console.log("==================================================");
  console.log("TravelRescue AI: Developer Seed Script (seed:dev)");
  console.log(`Target Project Host: ${getHostOnly(SUPABASE_URL)}`);
  console.log(`Service Key:         ${maskSecret(SERVICE_KEY)}`);
  console.log("==================================================");

  // 1. STATIONS (10 Core Junctions)
  const stations = [
    { code: "SBC", name: "KSR Bengaluru City", state: "Karnataka", zone: "SWR", latitude: 12.9783, longitude: 77.5685, is_junction: true, route_count: 85, platforms: 10 },
    { code: "MAS", name: "Puratchi Thalaivar Dr. MGR Central", state: "Tamil Nadu", zone: "SR", latitude: 13.0827, longitude: 80.2707, is_junction: true, route_count: 92, platforms: 15 },
    { code: "SC", name: "Secunderabad Junction", state: "Telangana", zone: "SCR", latitude: 17.4339, longitude: 78.5045, is_junction: true, route_count: 88, platforms: 10 },
    { code: "CSMT", name: "Chhatrapati Shivaji Maharaj Terminus", state: "Maharashtra", zone: "CR", latitude: 18.9402, longitude: 72.8356, is_junction: true, route_count: 110, platforms: 18 },
    { code: "NDLS", name: "New Delhi Railway Station", state: "Delhi", zone: "NR", latitude: 28.6431, longitude: 77.2197, is_junction: true, route_count: 140, platforms: 16 },
    { code: "NZM", name: "Hazrat Nizamuddin", state: "Delhi", zone: "NR", latitude: 28.5888, longitude: 77.2536, is_junction: true, route_count: 75, platforms: 8 },
    { code: "BPL", name: "Bhopal Junction", state: "Madhya Pradesh", zone: "WCR", latitude: 23.2599, longitude: 77.4126, is_junction: true, route_count: 65, platforms: 6 },
    { code: "NGP", name: "Nagpur Junction", state: "Maharashtra", zone: "CR", latitude: 21.1528, longitude: 79.0882, is_junction: true, route_count: 70, platforms: 8 },
    { code: "HWH", name: "Howrah Junction", state: "West Bengal", zone: "ER", latitude: 22.5839, longitude: 88.3426, is_junction: true, route_count: 130, platforms: 23 },
    { code: "MAO", name: "Madgaon Junction", state: "Goa", zone: "KR", latitude: 15.2736, longitude: 73.9581, is_junction: true, route_count: 40, platforms: 4 },
  ];

  const { error: stErr } = await supabase.from("stations").upsert(stations as unknown as UpsertPayload, { onConflict: "code" });
  if (stErr) console.warn("Stations upsert notice:", stErr.message);
  else console.log(`✓ Stations verified: ${stations.length} records.`);

  // 2. TRAINS (5 Trains)
  const trains = [
    {
      train_number: "20608",
      train_name: "Vande Bharat Express",
      train_type: "Vande Bharat",
      railway_zone: "SR",
      origin_station_code: "SBC",
      destination_station_code: "MAS",
      origin_name: "KSR Bengaluru",
      destination_name: "Chennai Central",
      days_running: ["Mon", "Tue", "Thu", "Fri", "Sat", "Sun"],
      total_distance_km: 359,
      total_duration_min: 265,
      stops_count: 4,
      has_official_timing: true,
      capacity: 1128,
    },
    {
      train_number: "12702",
      train_name: "Hussain Sagar Express",
      train_type: "Superfast",
      railway_zone: "CR",
      origin_station_code: "SC",
      destination_station_code: "CSMT",
      origin_name: "Secunderabad",
      destination_name: "Mumbai CSMT",
      days_running: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      total_distance_km: 790,
      total_duration_min: 845,
      stops_count: 14,
      has_official_timing: true,
      capacity: 1350,
    },
    {
      train_number: "12627",
      train_name: "Karnataka Express",
      train_type: "Superfast",
      railway_zone: "SWR",
      origin_station_code: "SBC",
      destination_station_code: "NDLS",
      origin_name: "KSR Bengaluru",
      destination_name: "New Delhi",
      days_running: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      total_distance_km: 2400,
      total_duration_min: 2340,
      stops_count: 32,
      has_official_timing: true,
      capacity: 1500,
    },
    {
      train_number: "22691",
      train_name: "Bengaluru Rajdhani Express",
      train_type: "Rajdhani",
      railway_zone: "SWR",
      origin_station_code: "SBC",
      destination_station_code: "NZM",
      origin_name: "KSR Bengaluru",
      destination_name: "Hazrat Nizamuddin",
      days_running: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      total_distance_km: 2365,
      total_duration_min: 2035,
      stops_count: 12,
      has_official_timing: true,
      capacity: 1080,
    },
    {
      train_number: "12028",
      train_name: "Shatabdi Express",
      train_type: "Shatabdi",
      railway_zone: "SR",
      origin_station_code: "SBC",
      destination_station_code: "MAS",
      origin_name: "KSR Bengaluru",
      destination_name: "Chennai Central",
      days_running: ["Mon", "Wed", "Thu", "Fri", "Sat", "Sun"],
      total_distance_km: 359,
      total_duration_min: 295,
      stops_count: 5,
      has_official_timing: true,
      capacity: 1200,
    },
  ];

  const { error: trErr } = await supabase.from("trains").upsert(trains as unknown as UpsertPayload, { onConflict: "train_number" });
  if (trErr) console.warn("Trains upsert notice:", trErr.message);
  else console.log(`✓ Trains verified: ${trains.length} records.`);

  // 3. ROUTES (3 Corridors)
  const routes = [
    {
      name: "Bengaluru - Chennai Corridor",
      from_station: "SBC",
      to_station: "MAS",
      distance_km: 359,
      avg_duration_min: 275,
    },
    {
      name: "Deccan Express Line",
      from_station: "SC",
      to_station: "CSMT",
      distance_km: 790,
      avg_duration_min: 845,
    },
    {
      name: "Grand Trunk Superfast Corridor",
      from_station: "SBC",
      to_station: "NDLS",
      distance_km: 2400,
      avg_duration_min: 2100,
    },
  ];

  const { data: routeData, error: rtErr } = await supabase.from("routes").upsert(routes as unknown as UpsertPayload, { onConflict: "from_station,to_station" }).select();
  if (rtErr) console.warn("Routes upsert notice:", rtErr.message);
  else console.log(`✓ Routes verified: ${routes.length} records.`);

  // 4. SCHEDULES (20 schedules)
  const sampleRouteId = routeData?.[0]?.id ?? null;
  const times = [
    { dep: "06:00", arr: "10:25", train: "20608", plat: "1" },
    { dep: "07:15", arr: "11:55", train: "12028", plat: "2" },
    { dep: "08:30", arr: "13:10", train: "20608", plat: "1" },
    { dep: "10:00", arr: "14:40", train: "12028", plat: "3" },
    { dep: "11:30", arr: "16:15", train: "20608", plat: "1" },
    { dep: "13:00", arr: "17:45", train: "12028", plat: "2" },
    { dep: "14:20", arr: "18:50", train: "20608", plat: "1" },
    { dep: "15:45", arr: "20:20", train: "12028", plat: "4" },
    { dep: "16:50", arr: "21:30", train: "20608", plat: "1" },
    { dep: "18:00", arr: "22:40", train: "12028", plat: "2" },
    { dep: "14:50", arr: "04:55", train: "12702", plat: "4" },
    { dep: "16:30", arr: "06:40", train: "12702", plat: "3" },
    { dep: "19:15", arr: "09:30", train: "12702", plat: "5" },
    { dep: "21:00", arr: "11:15", train: "12702", plat: "2" },
    { dep: "19:20", arr: "10:30", train: "12627", plat: "1" },
    { dep: "20:00", arr: "05:55", train: "22691", plat: "8" },
    { dep: "21:30", arr: "12:45", train: "12627", plat: "1" },
    { dep: "22:15", arr: "08:10", train: "22691", plat: "8" },
    { dep: "23:00", arr: "14:00", train: "12627", plat: "1" },
    { dep: "23:45", arr: "09:40", train: "22691", plat: "8" },
  ];

  const schedules = times.map((t) => ({
    route_id: sampleRouteId,
    train_number: t.train,
    departure_time: t.dep,
    arrival_time: t.arr,
    days_of_week: [1, 2, 3, 4, 5, 6, 7],
    platform: t.plat,
  }));

  const { error: scErr } = await supabase.from("schedules").upsert(schedules as unknown as UpsertPayload);
  if (scErr) console.warn("Schedules upsert notice:", scErr.message);
  else console.log(`✓ Schedules verified: ${schedules.length} records.`);

  // 5. SAMPLE DISRUPTION
  const disruption = {
    type: "EMERGENCY_TRACK_MAINTENANCE",
    severity: "CRITICAL",
    description: "Track interlocking failure on Bengaluru-Delhi corridor near Bhopal Junction. Express services suspended.",
    started_at: new Date().toISOString(),
    source: "sim",
  };
  const { data: disData } = await supabase.from("disruptions").insert([disruption]).select().single();
  console.log("✓ Sample disruption registered in database.");

  // 6. SAMPLE TRIPS
  const now = Date.now();
  const sampleTrips = [
    {
      passenger_id: "usr_janardhan",
      passenger_name: "Janardhan S",
      train_number: "12627",
      from_station_code: "SBC",
      to_station_code: "NDLS",
      status: "CANCELLED",
      pnr: "4281920194",
      seat_info: { coach: "B1", berth: "42", class: "3A" },
      departure_time: new Date(now + 3600000 * 2).toISOString(),
      arrival_time: new Date(now + 3600000 * 36).toISOString(),
      disruption_id: disData?.id ?? null,
    },
    {
      passenger_id: "usr_janardhan",
      passenger_name: "Janardhan S",
      train_number: "20608",
      from_station_code: "SBC",
      to_station_code: "MAS",
      status: "CONFIRMED",
      pnr: "6182901928",
      seat_info: { coach: "C1", berth: "18", class: "CC" },
      departure_time: new Date(now + 3600000 * 18).toISOString(),
      arrival_time: new Date(now + 3600000 * 22).toISOString(),
      disruption_id: null,
    },
    {
      passenger_id: "usr_janardhan",
      passenger_name: "Janardhan S",
      train_number: "12702",
      from_station_code: "SC",
      to_station_code: "CSMT",
      status: "CONFIRMED",
      pnr: "8192039182",
      seat_info: { coach: "A2", berth: "14", class: "2A" },
      departure_time: new Date(now + 3600000 * 48).toISOString(),
      arrival_time: new Date(now + 3600000 * 62).toISOString(),
      disruption_id: null,
    },
  ];

  const { error: trpsErr } = await supabase.from("trips").upsert(sampleTrips as unknown as UpsertPayload);
  if (trpsErr) console.warn("Trips upsert notice:", trpsErr.message);
  else console.log(`✓ Sample trips seeded: ${sampleTrips.length} records.`);

  console.log("==================================================");
  console.log("✓ seed:dev completed successfully!");
  console.log("==================================================");
}

seedDevDatabase().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
