import { NextResponse } from "next/server";
import { loadScenarioRun } from "@/lib/sim/persistence";
import { getSnapshotScenarioById } from "@/lib/data/snapshot-fallback";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing scenario ID" }, { status: 400 });
    }

    const run = (await loadScenarioRun(id)) || getSnapshotScenarioById(id);
    if (!run) {
      return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
    }

    return NextResponse.json({ scenario: run });
  } catch (err) {
    console.error("Failed to load scenario run, checking snapshot presets:", err);
    try {
      const { id } = await params;
      const fallback = getSnapshotScenarioById(id);
      if (fallback) {
        return NextResponse.json({ scenario: fallback });
      }
    } catch {
      // Ignore
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
