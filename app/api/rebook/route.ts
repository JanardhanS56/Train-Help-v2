import { NextResponse, type NextRequest } from "next/server";
import { executeRebooking, type RebookingRequest } from "@/lib/data/rebooking";
import { enforceRateLimit, GENERAL_API_RATE_LIMIT } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const rateLimit = await enforceRateLimit(req, GENERAL_API_RATE_LIMIT);
  if (!rateLimit.success) return rateLimit.response;
  try {
    const body: RebookingRequest = await req.json();

    if (!body.originalTripId || !body.alternative) {
      return NextResponse.json(
        { error: "Missing required parameters: originalTripId and alternative" },
        { status: 400 }
      );
    }

    const result = await executeRebooking(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to complete rebooking transaction." },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      rebooking: result,
    });
  } catch (err) {
    console.error("Rebooking API Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
