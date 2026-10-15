/**
 * app/api/sim/links/route.ts
 * Rail graph links for route map and alternative detour rendering.
 */

import { NextResponse } from "next/server";
import { trainRepository } from "@/lib/data/train-repository";

export async function GET() {
  try {
    const links = await trainRepository.getRailLinks();
    return NextResponse.json({
      links,
      isOffline: trainRepository.isOffline(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("ERR in /api/sim/links:", message);
    return NextResponse.json({ error: "Failed to fetch rail links", links: [] }, { status: 500 });
  }
}
