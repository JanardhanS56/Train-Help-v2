/**
 * app/api/sim/stations/route.ts
 * Stations listing for route canvas and station search.
 */

import { NextRequest, NextResponse } from "next/server";
import { trainRepository } from "@/lib/data/train-repository";
import { GENERAL_API_RATE_LIMIT, enforceRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const rateLimit = await enforceRateLimit(request, GENERAL_API_RATE_LIMIT);
  if (!rateLimit.success) return rateLimit.response;

  try {
    const stations = await trainRepository.getAllStations();
    return NextResponse.json({
      stations,
      isOffline: trainRepository.isOffline(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("ERR in /api/sim/stations:", message);
    return NextResponse.json({ error: "Failed to fetch stations", stations: [] }, { status: 500 });
  }
}
