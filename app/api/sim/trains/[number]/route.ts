/**
 * app/api/sim/trains/[number]/route.ts
 * Get full train schedule with ordered stops and geographic coordinates.
 */

import { NextRequest, NextResponse } from "next/server";
import { trainRepository } from "@/lib/data/train-repository";
import { getSnapshotTrainByNumber } from "@/lib/data/snapshot-fallback";
import { GENERAL_API_RATE_LIMIT, enforceRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ number: string }> }
) {
  const rateLimit = await enforceRateLimit(request, GENERAL_API_RATE_LIMIT);
  if (!rateLimit.success) return rateLimit.response;

  const { number } = await context.params;
  const trainNumber = number?.trim();

  if (!trainNumber) {
    return NextResponse.json({ error: "Train number is required" }, { status: 400 });
  }

  try {
    const train = await trainRepository.getTrainWithStops(trainNumber);
    if (train) {
      return NextResponse.json({
        train,
        isOffline: trainRepository.isOffline(),
      });
    }

    // Try snapshot fallback directly
    const fallbackTrain = getSnapshotTrainByNumber(trainNumber);
    if (fallbackTrain) {
      return NextResponse.json({
        train: fallbackTrain,
        isOffline: true,
      });
    }

    return NextResponse.json({ error: `Train ${trainNumber} not found` }, { status: 404 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`ERR in /api/sim/trains/${trainNumber}, falling back to snapshot:`, message);

    const fallbackTrain = getSnapshotTrainByNumber(trainNumber) || getSnapshotTrainByNumber("22691");
    if (fallbackTrain) {
      return NextResponse.json({
        train: fallbackTrain,
        isOffline: true,
      });
    }

    return NextResponse.json({ error: "Failed to fetch train details" }, { status: 500 });
  }
}
