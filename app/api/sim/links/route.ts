/**
 * app/api/sim/links/route.ts
 * Rail graph links for route map and alternative detour rendering.
 */

import { NextRequest, NextResponse } from "next/server";
import { trainRepository } from "@/lib/data/train-repository";
import { GENERAL_API_RATE_LIMIT, enforceRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const rateLimit = await enforceRateLimit(request, GENERAL_API_RATE_LIMIT);
  if (!rateLimit.success) return rateLimit.response;

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
