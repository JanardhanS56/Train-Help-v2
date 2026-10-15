/**
 * app/api/sim/stations/route.ts
 * Stations listing for route canvas and station search.
 */

import { NextRequest, NextResponse } from "next/server";
import { trainRepository } from "@/lib/data/train-repository";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse, GENERAL_API_RATE_LIMIT } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const clientId = getClientIdentifier(request.headers);
  const limitCheck = checkRateLimit(clientId, GENERAL_API_RATE_LIMIT);
  if (!limitCheck.success) {
    return createRateLimitResponse(limitCheck);
  }

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
