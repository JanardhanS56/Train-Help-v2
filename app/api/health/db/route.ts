/**
 * app/api/health/db/route.ts
 * Health check endpoint for database connectivity and latency monitoring.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/data/supabase-client";
import fallbackSnapshot from "@/data/clean/sim-snapshot.json";
export const runtime = "nodejs";

export async function GET(_request: NextRequest) {
  const start = Date.now();
  const supabase = getSupabaseClient();

  if (!supabase) {
    return NextResponse.json({
      ok: false,
      source: "unconfigured",
      isOffline: true,
      latencyMs: 0,
      message: "Supabase is not configured in this deployment. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      counts: {
        stations: fallbackSnapshot.stations.length,
        trains: fallbackSnapshot.trains.length,
        stops: fallbackSnapshot.stops.length,
        railLinks: fallbackSnapshot.rail_links.length,
      },
    });
  }

  try {
    const { count: stationsCount, error: stErr } = await supabase
      .from("stations")
      .select("*", { count: "exact", head: true });
    if (stErr) throw stErr;

    const { count: trainsCount, error: trErr } = await supabase
      .from("trains")
      .select("*", { count: "exact", head: true });
    if (trErr) throw trErr;

    const { count: stopsCount, error: spErr } = await supabase
      .from("train_stops")
      .select("*", { count: "exact", head: true });
    if (spErr) throw spErr;

    const { count: linksCount, error: lkErr } = await supabase
      .from("rail_links")
      .select("*", { count: "exact", head: true });
    if (lkErr) throw lkErr;

    const latencyMs = Date.now() - start;

    return NextResponse.json({
      ok: true,
      source: "supabase",
      isOffline: false,
      latencyMs,
      message: "Connected to Supabase PostgreSQL database.",
      counts: {
        stations: stationsCount ?? 0,
        trains: trainsCount ?? 0,
        stops: stopsCount ?? 0,
        railLinks: linksCount ?? 0,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn("Health check fallback engaged:", message);

    return NextResponse.json({
      ok: false,
      source: "error",
      isOffline: true,
      latencyMs: Date.now() - start,
      message: `Supabase unreachable (${message}). Offline snapshot active.`,
      counts: {
        stations: fallbackSnapshot.stations.length,
        trains: fallbackSnapshot.trains.length,
        stops: fallbackSnapshot.stops.length,
        railLinks: fallbackSnapshot.rail_links.length,
      },
    });
  }
}
