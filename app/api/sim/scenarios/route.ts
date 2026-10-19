import { NextResponse } from "next/server";
import { listSavedScenarios, saveScenarioRun, type SimScenarioRun } from "@/lib/sim/persistence";
import { getSnapshotPresetScenarios } from "@/lib/data/snapshot-fallback";

export async function GET() {
  try {
    const scenarios = await listSavedScenarios(30);
    return NextResponse.json({ scenarios });
  } catch (err) {
    console.error("Failed to list scenarios, returning preset snapshots:", err);
    const presets = getSnapshotPresetScenarios();
    return NextResponse.json({
      scenarios: presets.map((p) => ({
        id: p.id || "preset",
        name: p.name,
        trainNumber: p.trainNumber,
        createdAt: p.createdAt || new Date().toISOString(),
        obstacleCount: p.obstacles.length,
      })),
    });
  }
}

export async function POST(req: Request) {
  try {
    const body: SimScenarioRun = await req.json();
    if (!body || !body.name || !body.trainNumber) {
      return NextResponse.json(
        { error: "Invalid scenario payload. Name and trainNumber required." },
        { status: 400 }
      );
    }

    const result = await saveScenarioRun(body);
    if (!result) {
      return NextResponse.json(
        { error: "Failed to persist scenario run to Supabase." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      scenarioId: result.scenarioId,
      eventsCount: result.eventsCount,
    });
  } catch (err) {
    console.error("Failed to save scenario run:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
