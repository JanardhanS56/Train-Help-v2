/**
 * app/api/sim/links/route.ts
 * Rail graph links for route map and alternative detour rendering.
 */

import { NextRequest, NextResponse } from "next/server";
import { trainRepository } from "@/lib/data/train-repository";
import { getSnapshotRailLinks } from "@/lib/data/snapshot-fallback";
import { GENERAL_API_RATE_LIMIT, enforceRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const rateLimit = await enforceRateLimit(request, GENERAL_API_RATE_LIMIT);
  if (!rateLimit.success) return rateLimit.response;

  try {
    const links = await trainRepository.getRailLinks();
    return NextResponse.json({
      links: links && links.length > 0 ? links : getSnapshotRailLinks(),
      isOffline: trainRepository.isOffline(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("ERR in /api/sim/links, falling back to snapshot:", message);
    return NextResponse.json({
      links: getSnapshotRailLinks(),
      isOffline: true,
    });
  }
}
