/**
 * app/api/sim/advise/route.ts
 * AI Advisor API for real-time train disruption analysis and tactical rerouting advice.
 * Grounded in candidate plans with deterministic fallback.
 */

import { NextRequest, NextResponse } from "next/server";
import { getProviderConfig } from "@/lib/ai/providers";
import type { CandidatePlan } from "@/lib/sim/types";

interface AdviseRequestPayload {
  train: {
    train_number: string;
    train_name: string;
    train_type: string;
    origin_name: string;
    destination_name: string;
  };
  position: {
    currentMinute: number;
    distanceKm: number;
    currentStationCode: string | null;
    nextStationCode: string | null;
    delayMinutes: number;
    state: string;
  };
  obstacle: {
    id: string;
    type: string;
    title: string;
    description: string;
    locationType: string;
    fromStationCode?: string;
    toStationCode?: string;
    stationCode?: string;
    startMinute: number;
    durationMinutes: number;
    uncertaintyMinutes: number;
    effect: string;
  };
  candidatePlans: CandidatePlan[];
}

interface AdviseResponse {
  recommendedPlanId: string;
  headline: string;
  reasoning: string[];
  tradeoffs: string[];
  confidence: number;
  source: "llm" | "deterministic";
}

function buildDeterministicAdvice(
  candidatePlans: CandidatePlan[],
  obstacleTitle: string
): AdviseResponse {
  const topPlan = candidatePlans.find((p) => p.recommended) || candidatePlans[0];
  return {
    recommendedPlanId: topPlan.id,
    headline: topPlan.headline || `Execute ${topPlan.title} to minimize downstream operational delay`,
    reasoning: [
      `Section controller analysis indicates ${obstacleTitle} creates critical bottleneck on active path.`,
      ...topPlan.reasoning,
    ],
    tradeoffs: topPlan.tradeoffs,
    confidence: topPlan.confidence,
    source: "deterministic",
  };
}

export async function POST(request: NextRequest) {
  let payload: AdviseRequestPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { train, position, obstacle, candidatePlans } = payload;

  if (!candidatePlans || candidatePlans.length === 0) {
    return NextResponse.json({ error: "No candidate plans provided" }, { status: 400 });
  }

  const validPlanIds = new Set(candidatePlans.map((p) => p.id));
  const deterministicFallback = buildDeterministicAdvice(candidatePlans, obstacle?.title || "obstacle");

  const config = getProviderConfig();

  // If using mock provider or missing API key, return deterministic fallback immediately
  if (config.provider === "mock" || !config.apiKey) {
    return NextResponse.json(deterministicFallback);
  }

  const systemPrompt = `You are the Chief Train Controller & Senior Disruption Recovery Analyst for Indian Railways (TravelRescue AI).
You analyze track obstacles and advise the optimal tactical plan.

STRICT GROUNDING RULES:
1. You may ONLY choose a plan ID from this exact list: ${Array.from(validPlanIds).join(", ")}.
2. You must strictly use the facts, numbers (delay minutes, extra km, station codes), and tradeoffs given in the candidate plans.
3. NEVER invent train numbers, non-existent routes, or unrealistic delays.
4. Output valid JSON ONLY matching this schema, with no markdown code fences or conversational prose:
{
  "recommendedPlanId": "<must be one of the provided plan IDs>",
  "headline": "<concise tactical summary in <= 15 words>",
  "reasoning": ["<point 1>", "<point 2>", "<point 3>"],
  "tradeoffs": ["<tradeoff 1>", "<tradeoff 2>"],
  "confidence": <integer 75 to 98>
}`;

  const userPrompt = `Operational Situation Report:
- Train: ${train.train_number} (${train.train_name}, ${train.train_type})
- Route: ${train.origin_name} to ${train.destination_name}
- Current Position: ${position.distanceKm} km from origin, Near station: ${position.currentStationCode || "En route to " + position.nextStationCode}, State: ${position.state}
- Active Obstacle: ${obstacle.title} (${obstacle.type}, ${obstacle.durationMinutes}m duration with +/-${obstacle.uncertaintyMinutes}m uncertainty). Description: ${obstacle.description}

Evaluated Candidate Plans:
${candidatePlans
  .map(
    (p, idx) => `Plan ${idx + 1}:
  ID: ${p.id}
  Type: ${p.actionType}
  Title: ${p.title}
  Estimated Arrival Delay: +${p.delayMinutes} mins
  Extra Mileage: +${p.extraDistanceKm} km
  Transfers: ${p.transfers}
  Risk Score: ${p.riskScore}/100
  Detour / Stations: ${p.detourStationCodes?.join(" -> ") || "Mainline track"}
  Base Reasoning: ${p.reasoning?.join("; ")}
`
  )
  .join("\n")}

Select the optimal plan and deliver your tactical recommendation JSON:`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

  try {
    const res = await fetch(config.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
        ...(config.provider === "openrouter"
          ? {
              "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
              "X-Title": "TravelRescue Rail Simulator",
            }
          : {}),
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 600,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`AI Provider returned HTTP ${res.status}, using deterministic fallback.`);
      return NextResponse.json(deterministicFallback);
    }

    const data = await res.json();
    const rawText = data?.choices?.[0]?.message?.content || "";

    // Clean JSON markdown fences if present
    const cleanJson = rawText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsed = JSON.parse(cleanJson);

    // Validate schema
    if (
      parsed &&
      typeof parsed.recommendedPlanId === "string" &&
      validPlanIds.has(parsed.recommendedPlanId) &&
      typeof parsed.headline === "string" &&
      Array.isArray(parsed.reasoning) &&
      Array.isArray(parsed.tradeoffs)
    ) {
      return NextResponse.json({
        recommendedPlanId: parsed.recommendedPlanId,
        headline: parsed.headline,
        reasoning: parsed.reasoning.slice(0, 4),
        tradeoffs: parsed.tradeoffs.slice(0, 3),
        confidence: typeof parsed.confidence === "number" ? Math.min(99, Math.max(70, parsed.confidence)) : 88,
        source: "llm",
      });
    }

    console.warn("LLM response failed schema validation or selected invalid plan ID. Falling back to deterministic plan.");
    return NextResponse.json(deterministicFallback);
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn("AI Advisor request error or timeout, engaging deterministic advice:", err);
    return NextResponse.json(deterministicFallback);
  }
}
