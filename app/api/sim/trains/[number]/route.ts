/**
 * app/api/sim/trains/[number]/route.ts
 * Get full train schedule with ordered stops and geographic coordinates.
 */

import { NextRequest, NextResponse } from "next/server";
import { trainRepository } from "@/lib/data/train-repository";
import { GENERAL_API_RATE_LIMIT, enforceRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ number: string }> }
) {
  const rateLimit = await enforceRateLimit(request, GENERAL_API_RATE_LIMIT);
  if (!rateLimit.success) return rateLimit.response;

  const { number } = await context.params;

  try {
    const train = await trainRepository.getTrainWithStops(number);
    if (!train) {
      return NextResponse.json({ error: `Train ${number} not found` }, { status: 404 });
    }

    return NextResponse.json({
      train,
      isOffline: trainRepository.isOffline(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`ERR in /api/sim/trains/${number}:`, message);
    return NextResponse.json({ error: "Failed to fetch train details" }, { status: 500 });
  }
}
