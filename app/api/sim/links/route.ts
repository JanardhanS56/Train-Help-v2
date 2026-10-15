/**
 * app/api/sim/links/route.ts
 * Rail graph links for route map and alternative detour rendering.
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
