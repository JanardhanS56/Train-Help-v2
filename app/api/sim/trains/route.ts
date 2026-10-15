/**
 * app/api/sim/trains/route.ts
 * Search and list trains for the simulation selector.
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

  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get("q") || "";
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

  try {
    const trains = await trainRepository.searchTrains(q, limit);
    return NextResponse.json({
      trains,
      isOffline: trainRepository.isOffline(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("ERR in /api/sim/trains:", message);
    return NextResponse.json(
      { error: "Failed to search trains", trains: [], isOffline: true },
      { status: 500 }
    );
  }
}
