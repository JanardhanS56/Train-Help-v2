/**
 * app/api/sim/stations/route.ts
 * Stations listing for route canvas and station search.
 */

import { NextResponse } from "next/server";
import { trainRepository } from "@/lib/data/train-repository";

export async function GET() {
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
