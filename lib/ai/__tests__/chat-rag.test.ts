/**
 * lib/ai/__tests__/chat-rag.test.ts
 * Unit tests for Phase 4 Multi-Turn Assistant & Chat RAG Engine.
 * Tests:
 * 1. Grounded System Prompt Builder (anti-hallucination, active trip, alternatives, preferences).
 * 2. Structured Action Parser (SELECT_ALTERNATIVE, ADJUST_PREFERENCE, TRIGGER_SIMULATION).
 * 3. Chat persistence with local fallback (saveChatMessage, getChatHistory).
 * 4. Chat API route behavior (missing API key failure, valid response payload).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { buildGroundedSystemPrompt, type GroundingContext } from "../grounding";
import { parseStructuredActions } from "../action-parser";
import { saveChatMessage, getChatHistory, clearChatHistory } from "../../data/chat";
import { POST } from "../../../app/api/chat/route";
import { NextRequest } from "next/server";
import type { Trip, Alternative, UserPreferences } from "@/lib/types";

describe("Phase 4: Grounded System Prompt Builder", () => {
  const mockTrip: Trip = {
    id: "trip-test-1",
    pnr: "4281920194",
    passengerName: "Ananya Iyer",
    travelClass: "2A",
    fare: 2850,
    coach: "A1",
    berth: "12",
    status: "cancelled",
    disruptionReason: "Locomotive traction motor fault",
    segments: [
      {
        trainName: "Bengaluru Rajdhani",
        trainNumber: "22691",
        departureStation: { code: "SBC", city: "Bengaluru", name: "KSR Bengaluru" },
        arrivalStation: { code: "NDLS", city: "New Delhi", name: "New Delhi" },
        departureTime: new Date("2026-10-16T20:00:00Z"),
        arrivalTime: new Date("2026-10-18T05:30:00Z"),
        status: "cancelled",
        travelClass: "2A",
      },
    ],
  };

  const mockAlternative: Alternative = {
    id: "alt-test-99",
    tripId: "trip-test-1",
    trainName: "Karnataka Express",
    trainNumber: "12627",
    fromStation: { code: "SBC", city: "Bengaluru", name: "KSR Bengaluru" },
    toStation: { code: "NDLS", city: "New Delhi", name: "New Delhi" },
    departureTime: new Date("2026-10-16T19:20:00Z"),
    arrivalTime: new Date("2026-10-18T10:30:00Z"),
    duration: 2350,
    changes: 0,
    changeStations: [],
    travelClass: "3A",
    coachBerth: "Coach B2 · Berth 24 (Lower)",
    fare: 2200,
    originalFare: 2850,
    fareDifference: -650,
    availability: { type: "available", count: 18, label: "AVL 18" },
  };

  const mockPrefs: UserPreferences = {
    maxBudget: 3500,
    classes: ["2A", "3A"],
    onlyTheseClasses: true,
    seatPreference: "confirmed-only",
    maxChanges: 0,
    departureWindow: "evening",
    deadlineDay: "none",
    deadlineTime: null,
    flexibleSchedule: true,
    flexibilityHours: 3,
    includeNearbyStations: false,
    selectedNearbyStationCodes: [],
    berthPreference: "lower",
    priorityProfile: "fastest",
    preset: "fastest",
  };

  it("injects all context sections and enforces anti-hallucination rules", () => {
    const context: GroundingContext = {
      activeTrip: mockTrip,
      disruption: {
        type: "Mechanical Breakdown",
        description: "Overhead electric equipment breakdown at Guntakal",
        severity: "Severe",
        delayMinutes: 240,
      },
      topAlternatives: [mockAlternative],
      preferences: mockPrefs,
      currentTime: new Date("2026-10-16T15:00:00Z"),
    };

    const prompt = buildGroundedSystemPrompt(context);

    // Anti-hallucination directives
    expect(prompt).toContain("STRICT ANTI-HALLUCINATION RULES");
    expect(prompt).toContain("ONLY recommend trains, schedules, classes, and fares that are explicitly provided");

    // Active passenger trip
    expect(prompt).toContain("PNR: 4281920194");
    expect(prompt).toContain("Passenger: Ananya Iyer");
    expect(prompt).toContain("Bengaluru Rajdhani (#22691)");
    expect(prompt).toContain("Status: CANCELLED");
    expect(prompt).toContain("Locomotive traction motor fault");

    // Disruption
    expect(prompt).toContain("Mechanical Breakdown");
    expect(prompt).toContain("Overhead electric equipment breakdown at Guntakal");

    // Top alternatives
    expect(prompt).toContain("TOP VERIFIED ALTERNATIVES");
    expect(prompt).toContain("Karnataka Express (#12627)");
    expect(prompt).toContain("Fare: ₹2200");
    expect(prompt).toContain("Fare Difference: -₹650");
    expect(prompt).toContain("AVL 18");

    // User preferences
    expect(prompt).toContain("Max Budget: ₹3500");
    expect(prompt).toContain("Preferred Classes: 2A, 3A");
    expect(prompt).toContain("Berth Preference: lower");

    // Structured action protocol
    expect(prompt).toContain("STRUCTURED ACTION PROTOCOL");
    expect(prompt).toContain("ACTION:SELECT_ALTERNATIVE");
  });
});

describe("Phase 4: Structured Action Parser", () => {
  it("extracts SELECT_ALTERNATIVE action tag and produces clean content", () => {
    const raw = "I recommend booking Karnataka Express. ACTION:SELECT_ALTERNATIVE:alt-test-99";
    const { cleanContent, actions } = parseStructuredActions(raw);

    expect(cleanContent).toBe("I recommend booking Karnataka Express.");
    expect(actions).toHaveLength(1);
    expect(actions[0].type).toBe("SELECT_ALTERNATIVE");
    expect(actions[0].payload.alternativeId).toBe("alt-test-99");
    expect(actions[0].label).toContain("alt-test-99");
  });

  it("extracts ADJUST_PREFERENCE action tag", () => {
    const raw = "You can increase your budget to ₹4,500 for Rajdhani berths. ACTION:ADJUST_PREFERENCE:maxBudget:4500";
    const { cleanContent, actions } = parseStructuredActions(raw);

    expect(cleanContent).toBe("You can increase your budget to ₹4,500 for Rajdhani berths.");
    expect(actions).toHaveLength(1);
    expect(actions[0].type).toBe("ADJUST_PREFERENCE");
    expect(actions[0].payload.preferenceKey).toBe("maxBudget");
    expect(actions[0].payload.preferenceValue).toBe("4500");
  });

  it("extracts TRIGGER_SIMULATION action tag", () => {
    const raw = "Test track obstacle handling now. ACTION:TRIGGER_SIMULATION:TRACK_OBSTACLE";
    const { cleanContent, actions } = parseStructuredActions(raw);

    expect(cleanContent).toBe("Test track obstacle handling now.");
    expect(actions).toHaveLength(1);
    expect(actions[0].type).toBe("TRIGGER_SIMULATION");
    expect(actions[0].payload.simulationEvent).toBe("TRACK_OBSTACLE");
  });

  it("handles multiple mixed action tags in one message", () => {
    const raw = "Option A is available. ACTION:SELECT_ALTERNATIVE:alt-1 ACTION:ADJUST_PREFERENCE:berthPreference:lower";
    const { cleanContent, actions } = parseStructuredActions(raw);

    expect(cleanContent).toBe("Option A is available.");
    expect(actions).toHaveLength(2);
    expect(actions[0].type).toBe("SELECT_ALTERNATIVE");
    expect(actions[1].type).toBe("ADJUST_PREFERENCE");
  });

  it("returns clean content with empty actions when no action tags exist", () => {
    const raw = "Tatkal booking opens daily at 10:00 AM IST for AC classes.";
    const { cleanContent, actions } = parseStructuredActions(raw);

    expect(cleanContent).toBe(raw);
    expect(actions).toHaveLength(0);
  });
});

describe("Phase 4: Chat Persistence", () => {
  const testConvId = `conv-unit-test-${Date.now()}`;

  afterEach(async () => {
    await clearChatHistory(testConvId);
  });

  it("saves messages and retrieves conversation history with local fallback", async () => {
    const saveRes1 = await saveChatMessage({
      conversation_id: testConvId,
      role: "user",
      content: "When does Tatkal open for 3A?",
    });

    expect(saveRes1.success).toBe(true);
    expect(saveRes1.messageId).toBeDefined();

    const saveRes2 = await saveChatMessage({
      conversation_id: testConvId,
      role: "assistant",
      content: "Tatkal booking opens at 10:00 AM IST for all AC classes.",
      actions: [{ type: "INFO", label: "Check Schedule" }],
    });

    expect(saveRes2.success).toBe(true);

    const historyRes = await getChatHistory(testConvId);
    expect(historyRes.messages.length).toBeGreaterThanOrEqual(2);
    expect(historyRes.messages[0].content).toBe("When does Tatkal open for 3A?");
    expect(historyRes.messages[1].role).toBe("assistant");
  });
});

describe("Phase 4: Chat API Route", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.DEEPSEEK_API_KEY;
    delete process.env.AI_API_KEY;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("automatically falls back to deterministic advice with X-Fallback-Mode header when API key is missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Show me alternative trains" }],
        stream: false,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("X-Fallback-Mode")).toBe("true");

    const data = await res.json();
    expect(data.provider).toBe("deterministic-fallback");
    expect(data.model).toBe("offline-rule-engine");
    expect(data.reply).toContain("Alternative Train Recommendations");
  });

  it("streams fallback advice with X-Fallback-Mode header when API key is missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "What is the emergency helpline?" }],
        stream: true,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("X-Fallback-Mode")).toBe("true");
    expect(res.headers.get("Content-Type")).toContain("text/event-stream");
  });

  it("validates request payload and rejects empty messages with 400", async () => {
    process.env.DEEPSEEK_API_KEY = "test-sk-key";

    const req = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [] }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toContain("messages array is required");
  });

  it("successfully processes non-streaming request with mocked DeepSeek API", async () => {
    process.env.DEEPSEEK_API_KEY = "test-sk-key";

    // Mock upstream fetch to DeepSeek API
    globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("deepseek.com")) {
        return new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: "I recommend Karnataka Express. ACTION:SELECT_ALTERNATIVE:alt-12627",
                },
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response("Not Found", { status: 404 });
    });

    const req = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "What is my best option?" }],
        stream: false,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.reply).toBe("I recommend Karnataka Express.");
    expect(data.actions).toHaveLength(1);
    expect(data.actions[0].type).toBe("SELECT_ALTERNATIVE");
    expect(data.actions[0].payload.alternativeId).toBe("alt-12627");
  });

  it("falls back to deterministic advice when upstream provider returns 429 or 503", async () => {
    process.env.DEEPSEEK_API_KEY = "test-sk-key";

    // Mock upstream rate-limit (429)
    globalThis.fetch = vi.fn().mockImplementation(async () => {
      return new Response("Too Many Requests", { status: 429 });
    });

    const req = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "What are the Tatkal cancellation rules?" }],
        stream: false,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("X-Fallback-Mode")).toBe("true");

    const data = await res.json();
    expect(data.provider).toBe("deterministic-fallback");
    expect(data.reply).toContain("Tatkal Ticket Cancellation Rules");
  });
});
