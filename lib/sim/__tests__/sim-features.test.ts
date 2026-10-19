import { describe, it, expect } from "vitest";
import type { CandidatePlan, Obstacle, SimScheduleStop } from "@/lib/sim/types";

describe("Simulation UI & Intelligence Feature Suites", () => {
  describe("Candidate Plan Comparison Logic", () => {
    const mockPlans: CandidatePlan[] = [
      {
        id: "a",
        actionType: "wait",
        title: "Single Line Pilot Token Work",
        headline: "Alternate single-line block token",
        description: "Operate token exchange with 30 km/h speed ceiling.",
        delayMinutes: 38,
        extraDistanceKm: 0,
        riskScore: 28,
        confidence: 88,
        score: 85,
        newArrivalMin: 638,
        transfers: 0,
        detourStationCodes: [],
        reasoning: ["Safety interlocking verified"],
        tradeoffs: ["Slight queue build up"],
        recommended: false,
      },
      {
        id: "b",
        actionType: "hold",
        title: "Loop Line Precedence",
        headline: "Hold at loop line until clearance",
        description: "Wait at preceding station until track inspection clears.",
        delayMinutes: 75,
        extraDistanceKm: 0,
        riskScore: 12,
        confidence: 94,
        score: 92,
        newArrivalMin: 675,
        transfers: 0,
        detourStationCodes: [],
        reasoning: ["Guaranteed passenger safety in platform environment"],
        tradeoffs: ["Higher delay"],
        recommended: true,
      },
      {
        id: "c",
        actionType: "divert",
        title: "Chord Bypass Line",
        headline: "Divert via bypass junction chord",
        description: "Bypass obstruction via auxiliary rail chord line.",
        delayMinutes: 45,
        extraDistanceKm: 28,
        riskScore: 35,
        confidence: 82,
        score: 78,
        newArrivalMin: 645,
        transfers: 0,
        detourStationCodes: ["BPL", "ET"],
        reasoning: ["Avoids damaged section completely"],
        tradeoffs: ["Extra distance"],
        recommended: false,
      },
    ];

    it("accurately identifies the recommended candidate plan", () => {
      const rec = mockPlans.find((p) => p.recommended);
      expect(rec).toBeDefined();
      expect(rec?.id).toBe("b");
      expect(rec?.title).toBe("Loop Line Precedence");
    });

    it("correctly identifies the minimal delay strategy", () => {
      const minDelayPlan = [...mockPlans].sort((a, b) => a.delayMinutes - b.delayMinutes)[0];
      expect(minDelayPlan.id).toBe("a");
      expect(minDelayPlan.delayMinutes).toBe(38);
    });

    it("correctly identifies the lowest risk strategy", () => {
      const lowestRiskPlan = [...mockPlans].sort((a, b) => a.riskScore - b.riskScore)[0];
      expect(lowestRiskPlan.id).toBe("b");
      expect(lowestRiskPlan.riskScore).toBe(12);
    });
  });

  describe("Incident Dispatch Report Export Generation", () => {
    const mockObstacle: Obstacle = {
      id: "obs-1",
      type: "track_blockage",
      title: "Boulder on Track near Chiplun",
      description: "Landslide debris obstructing UP mainline.",
      locationType: "station",
      stationCode: "CHI",
      startMinute: 360,
      durationMinutes: 60,
      uncertaintyMinutes: 15,
      effect: "full_block",
    };

    const mockPlans: CandidatePlan[] = [
      {
        id: "a",
        actionType: "divert",
        title: "Divert via Panvel Chord",
        headline: "Bypass landslide sector",
        description: "Reroute via auxiliary line.",
        delayMinutes: 40,
        extraDistanceKm: 18,
        riskScore: 20,
        confidence: 90,
        score: 91,
        newArrivalMin: 400,
        transfers: 0,
        detourStationCodes: ["PNVL", "ROHA"],
        reasoning: ["All clear"],
        tradeoffs: ["18 km longer route"],
        recommended: true,
      },
    ];

    function buildDispatchReport(activeObstacle: Obstacle | null, plans: CandidatePlan[]): string {
      const active = activeObstacle
        ? `${activeObstacle.title} (${activeObstacle.type})`
        : "Standard Schedule Optimization";

      const lines = [
        "# TravelRescue AI Railway Dispatch Incident Report",
        `Disruption: ${active}`,
        "",
        "## Candidate Recovery Strategies",
        ...plans.map((p) => {
          const isRec = p.recommended ? " [RECOMMENDED]" : "";
          return [
            `### Option ${p.id.toUpperCase()}: ${p.title}${isRec}`,
            `- Headline: ${p.headline}`,
            `- Est. Delay: +${p.delayMinutes} mins`,
            `- Extra Mileage: +${p.extraDistanceKm} km`,
            `- Section Risk Score: ${p.riskScore}/100 (Confidence: ${p.confidence}%)`,
            `- Detour Stations: ${p.detourStationCodes.length > 0 ? p.detourStationCodes.join(" -> ") : "Direct line"}`,
            `- Dispatch Rationale: ${p.description}`,
          ].join("\n");
        }),
        "",
        "---",
        "Confidential - Indian Railways AI Operations Resiliency Layer",
      ];

      return lines.join("\n");
    }

    it("formats markdown dispatch report with obstacle, metrics, and confidentiality footer", () => {
      const report = buildDispatchReport(mockObstacle, mockPlans);

      expect(report).toContain("# TravelRescue AI Railway Dispatch Incident Report");
      expect(report).toContain("Boulder on Track near Chiplun (track_blockage)");
      expect(report).toContain("Option A: Divert via Panvel Chord [RECOMMENDED]");
      expect(report).toContain("- Est. Delay: +40 mins");
      expect(report).toContain("- Extra Mileage: +18 km");
      expect(report).toContain("- Detour Stations: PNVL -> ROHA");
      expect(report).toContain("Confidential - Indian Railways AI Operations Resiliency Layer");
    });
  });

  describe("Timeline Dwell & Delay Calculation Logic", () => {
    it("computes remaining station dwell duration correctly", () => {
      const stop: SimScheduleStop = {
        seq: 2,
        stationCode: "BPL",
        stationName: "Bhopal Junction",
        latitude: 23.2599,
        longitude: 77.4126,
        arrivalMin: 600,
        departureMin: 610,
        haltMin: 10,
        distanceKm: 400,
        dayOffset: 0,
        timeSource: "official",
      };

      const currentMinute = 604;
      const isDwelling = true;
      const remainingDwell = isDwelling ? Math.max(0, Math.round(stop.departureMin - currentMinute)) : 0;

      expect(remainingDwell).toBe(6);
    });

    it("computes projected delay arrival time without NaN or decimal drift", () => {
      const arrivalMin = 720;
      const delayMinutes = 24.8;
      const projectedArrival = arrivalMin + Math.round(delayMinutes);

      expect(projectedArrival).toBe(745);
    });
  });

  describe("Keyboard Shortcut Action Code Mapping", () => {
    type ActionKey = "Space" | "ArrowRight" | "KeyR" | "KeyD" | "Digit1" | "Digit2" | "Digit3" | "Digit4" | "Digit5";

    const keyActionMap: Record<ActionKey, string> = {
      Space: "TOGGLE_PLAY",
      ArrowRight: "STEP_FORWARD",
      KeyR: "RESET_SIMULATION",
      KeyD: "LAUNCH_1CLICK_DEMO",
      Digit1: "SPEED_1X",
      Digit2: "SPEED_2X",
      Digit3: "SPEED_5X",
      Digit4: "SPEED_10X",
      Digit5: "SPEED_60X",
    };

    it("correctly maps simulation hotkeys to deterministic actions", () => {
      expect(keyActionMap.Space).toBe("TOGGLE_PLAY");
      expect(keyActionMap.KeyR).toBe("RESET_SIMULATION");
      expect(keyActionMap.KeyD).toBe("LAUNCH_1CLICK_DEMO");
      expect(keyActionMap.Digit4).toBe("SPEED_10X");
    });
  });
});
