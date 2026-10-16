import { NextRequest, NextResponse } from "next/server";
import { searchJourneys } from "@/lib/journeys";
import { enforceRateLimit, GENERAL_API_RATE_LIMIT } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const rateLimit = await enforceRateLimit(req, GENERAL_API_RATE_LIMIT);
  if (!rateLimit.success) return rateLimit.response;

  try {
    const { searchParams } = req.nextUrl;
    const from = searchParams.get("from")?.trim().toUpperCase();
    const to = searchParams.get("to")?.trim().toUpperCase();
    const date = searchParams.get("date")?.trim();
    const includeNearby = searchParams.get("includeNearby") === "true";

    if (!from || !to) {
      return NextResponse.json(
        { error: "Missing required query parameters: 'from' and 'to' station codes." },
        { status: 400 }
      );
    }

    if (from === to) {
      return NextResponse.json(
        { error: "Origin and destination stations cannot be identical." },
        { status: 400 }
      );
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const travelDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayStr;

    const result = await searchJourneys({
      fromCode: from,
      toCode: to,
      date: travelDate,
      includeNearby,
    });

    return NextResponse.json(result, {
      status: 200,
      headers: {
        "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    console.error("Journeys API Error:", error);
    return NextResponse.json(
      { error: "Internal server error while searching train journeys." },
      { status: 500 }
    );
  }
}
