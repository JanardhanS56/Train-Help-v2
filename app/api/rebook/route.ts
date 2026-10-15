import { NextResponse } from "next/server";
import { executeRebooking, type RebookingRequest } from "@/lib/data/rebooking";

export async function POST(req: Request) {
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
