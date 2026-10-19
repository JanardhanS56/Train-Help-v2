/**
 * app/api/sim/stations/route.ts
 * Stations listing for route canvas and station search.
 */

import { NextRequest, NextResponse } from "next/server";
import { trainRepository } from "@/lib/data/train-repository";
import { getSnapshotStations } from "@/lib/data/snapshot-fallback";
import { GENERAL_API_RATE_LIMIT, enforceRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const rateLimit = await enforceRateLimit(request, GENERAL_API_RATE_LIMIT);
  if (!rateLimit.success) return rateLimit.response;

  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get("q") || "";
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));

  try {
    const stations = q
      ? await trainRepository.searchStations(q, limit)
      : await trainRepository.getAllStations();

    return NextResponse.json({
      stations: stations && stations.length > 0 ? stations : getSnapshotStations(q, limit),
      isOffline: trainRepository.isOffline(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("ERR in /api/sim/stations, falling back to snapshot:", message);
    return NextResponse.json({
      stations: getSnapshotStations(q, limit),
      isOffline: true,
    });
  }
}
