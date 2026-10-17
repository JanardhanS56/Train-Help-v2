/**
 * lib/ai/__tests__/fallback-advisor.test.ts
 * Unit tests for Deterministic Fallback Advisor and Offline Railway Rules Engine.
 * Tests:
 * 1. Intent classification across all 4 railway categories + general.
 * 2. Full refund eligibility & TDR filing rules (delay > 3h, cancellation, < 3h).
 * 3. Alternative train recommendations (with active trip & alternatives, action tags).
 * 4. RAC & Tatkal cancellation policies (0% Tatkal, 30-min RAC window, clerkage).
 * 5. General railway safety & emergency assistance contacts (139, RailMadad, medical, RPF).
 */

import { describe, it, expect } from "vitest";
import {
  generateDeterministicAdvice,
  classifyIntent,
  type FallbackIntent,
} from "../fallback-advisor";
import type { GroundingContext } from "../grounding";
import type { Trip, Alternative } from "@/lib/types";

describe("Fallback Advisor: Intent Classification", () => {
  const cases: { query: string; expected: FallbackIntent }[] = [
    // 1. Refund & TDR
    { query: "How do I get a full refund for my late train?", expected: "refund_tdr" },
    { query: "Can I file TDR online for delayed train?", expected: "refund_tdr" },
    { query: "Ticket deposit receipt filing process", expected: "refund_tdr" },
    { query: "Delay refund rules if train is delayed by 3 hours", expected: "refund_tdr" },

    // 2. Alternative Recommendations
    { query: "Show me alternative trains to New Delhi", expected: "alternative_recommendations" },
    { query: "Recommend another train or available options", expected: "alternative_recommendations" },
    { query: "Can I switch train to another departure?", expected: "alternative_recommendations" },
    { query: "Find available train for this route", expected: "alternative_recommendations" },

    // 3. RAC & Tatkal Cancellation Rules
    { query: "What are the rules for Tatkal cancellation charges?", expected: "cancellation_rules" },
    { query: "Can I cancel my RAC ticket before chart preparation?", expected: "cancellation_rules" },
    { query: "What is the clerkage fee for waitlist cancel?", expected: "cancellation_rules" },
    { query: "How to cancel ticket on IRCTC?", expected: "cancellation_rules" },

    // 4. Safety & Emergency Assistance
    { query: "What is the railway emergency helpline number?", expected: "safety_emergency" },
    { query: "I need medical assistance doctor on call", expected: "safety_emergency" },
    { query: "How to contact RPF police for harassment or theft?", expected: "safety_emergency" },
    { query: "Rail Madad SOS complaint", expected: "safety_emergency" },

    // 5. General Fallback
    { query: "Hello what can you do?", expected: "general" },
    { query: "Good morning", expected: "general" },
  ];

  cases.forEach(({ query, expected }) => {
    it(`classifies "${query}" as "${expected}"`, () => {
      expect(classifyIntent(query)).toBe(expected);
    });
  });
});

describe("Fallback Advisor: Category 1 - Full Refund Eligibility & TDR Filing Rules", () => {
  const baseTrip: Trip = {
    id: "trip-test-pnr",
    pnr: "6382910482",
    passengerName: "Vikram Rathore",
    travelClass: "2A",
    fare: 3120,
    coach: "A2",
    berth: "19",
    status: "delayed",
    segments: [
      {
        trainName: "Vande Bharat Express",
        trainNumber: "20608",
        departureStation: { code: "SBC", city: "Bengaluru", name: "KSR Bengaluru" },
        arrivalStation: { code: "MAS", city: "Chennai", name: "MGR Chennai Central" },
        departureTime: new Date("2026-10-18T05:45:00Z"),
        arrivalTime: new Date("2026-10-18T10:10:00Z"),
        status: "delayed",
        travelClass: "2A",
      },
    ],
  };

  it("provides 100% full refund and step-by-step TDR filing when delay >= 180 minutes", () => {
    const context: GroundingContext = {
      activeTrip: baseTrip,
      disruption: {
        type: "Signal Interlocking Glitch",
        delayMinutes: 210, // 3h 30m
        severity: "Severe",
      },
    };

    const advice = generateDeterministicAdvice("Am I eligible for a full refund?", context);

    expect(advice).toContain("100% Full Refund Eligible");
    expect(advice).toContain("more than 3 hours");
    expect(advice).toContain("Vande Bharat Express (#20608)");
    expect(advice).toContain("3h 30m late");
    expect(advice).toContain("PNR **6382910482**");
    expect(advice).toContain("Train Late More Than Three Hours and Passenger Not Travelled");
    expect(advice).toContain("File TDR");
  });

  it("explains automatic refund for officially cancelled trains without requiring TDR for e-tickets", () => {
    const cancelledTrip: Trip = {
      ...baseTrip,
      status: "cancelled",
      segments: [{ ...baseTrip.segments[0], status: "cancelled" }],
    };

    const context: GroundingContext = {
      activeTrip: cancelledTrip,
      disruption: {
        type: "Track Flooding",
        delayMinutes: 0,
      },
    };

    const advice = generateDeterministicAdvice("How do I get my money back?", context);

    expect(advice).toContain("CANCELLED");
    expect(advice).toContain("no TDR is required");
    expect(advice).toContain("automatically refund");
    expect(advice).toContain("3 to 7 working days");
  });

  it("explains the standard 3-hour threshold when train delay is less than 3 hours", () => {
    const context: GroundingContext = {
      activeTrip: baseTrip,
      disruption: {
        type: "Precautionary Speed Restriction",
        delayMinutes: 45,
      },
    };

    const advice = generateDeterministicAdvice("Can I claim a full refund right now?", context);

    expect(advice).toContain("Train Delayed > 3 Hours");
    expect(advice).toContain("Voluntary Cancellation (Delay < 3 Hours)");
    expect(advice).toContain("**DELAYED** with 45m delay");
  });
});

describe("Fallback Advisor: Category 2 - Alternative Train Recommendations", () => {
  const activeTrip: Trip = {
    id: "trip-alt-test",
    pnr: "2849102847",
    passengerName: "Sunita Menon",
    travelClass: "3A",
    fare: 1850,
    coach: "B3",
    berth: "42",
    status: "delayed",
    segments: [
      {
        trainName: "Karnataka Express",
        trainNumber: "12627",
        departureStation: { code: "SBC", city: "Bengaluru", name: "KSR Bengaluru" },
        arrivalStation: { code: "NDLS", city: "New Delhi", name: "New Delhi" },
        departureTime: new Date("2026-10-18T19:20:00Z"),
        arrivalTime: new Date("2026-10-20T10:30:00Z"),
        status: "delayed",
        travelClass: "3A",
      },
    ],
  };

  const mockAlternatives: Alternative[] = [
    {
      id: "alt-rajdhani-22691",
      tripId: "trip-alt-test",
      trainName: "Bengaluru Rajdhani",
      trainNumber: "22691",
      fromStation: { code: "SBC", city: "Bengaluru", name: "KSR Bengaluru" },
      toStation: { code: "NDLS", city: "New Delhi", name: "New Delhi" },
      departureTime: new Date("2026-10-18T20:00:00Z"),
      arrivalTime: new Date("2026-10-20T05:30:00Z"),
      duration: 2010,
      changes: 0,
      changeStations: [],
      travelClass: "3A",
      coachBerth: "Coach B1 · Berth 18",
      fare: 2600,
      originalFare: 1850,
      fareDifference: 750,
      availability: { type: "available", count: 12, label: "AVL 12" },
    },
  ];

  it("recommends verified alternative trains and includes SELECT_ALTERNATIVE action tag", () => {
    const context: GroundingContext = {
      activeTrip,
      topAlternatives: mockAlternatives,
    };

    const advice = generateDeterministicAdvice("What alternative trains can I take?", context);

    expect(advice).toContain("Verified Alternative Train Recommendations");
    expect(advice).toContain("**KSR Bengaluru (SBC)** ➔ **New Delhi (NDLS)**");
    expect(advice).toContain("Bengaluru Rajdhani (#22691)");
    expect(advice).toContain("**₹2600** (Diff: +₹750)");
    expect(advice).toContain("AVL 12");
    expect(advice).toContain("ACTION:SELECT_ALTERNATIVE:alt-rajdhani-22691");
  });

  it("handles missing alternatives gracefully by directing user to journey search", () => {
    const context: GroundingContext = {
      activeTrip,
      topAlternatives: [],
    };

    const advice = generateDeterministicAdvice("Show me other train options", context);

    expect(advice).toContain("No pre-computed alternatives are currently cached");
    expect(advice).toContain("Journey Search");
    expect(advice).toContain("SBC");
    expect(advice).toContain("NDLS");
  });
});

describe("Fallback Advisor: Category 3 - RAC & Tatkal Cancellation Rules", () => {
  it("details 0% refund for confirmed Tatkal and exemptions for train delays", () => {
    const advice = generateDeterministicAdvice("What is the refund rule for Tatkal cancellation?");

    expect(advice).toContain("Tatkal Ticket Cancellation Rules");
    expect(advice).toContain("No refund** (0%) is granted");
    expect(advice).toContain("delayed by > 3 hours");
  });

  it("details 30-minute window and clerkage fees for RAC tickets", () => {
    const advice = generateDeterministicAdvice("Can I cancel RAC ticket and what are charges?");

    expect(advice).toContain("RAC (Reservation Against Cancellation) Rules");
    expect(advice).toContain("30 minutes** before scheduled train departure");
    expect(advice).toContain("Flat **₹60 + GST**");
    expect(advice).toContain("post chart preparation");
  });
});

describe("Fallback Advisor: Category 4 - General Railway Safety & Emergency Assistance", () => {
  it("provides comprehensive emergency helpline 139 and options", () => {
    const advice = generateDeterministicAdvice("What is the railway emergency helpline?");

    expect(advice).toContain("139 (RailMadad All-in-One Helpline)");
    expect(advice).toContain("Available 24x7");
    expect(advice).toContain("Security & RPF assistance");
    expect(advice).toContain("Medical emergency");
    expect(advice).toContain("Accident");
  });

  it("provides medical on call and women passenger safety contacts", () => {
    const advice = generateDeterministicAdvice("I need a doctor for emergency medical help on train");

    expect(advice).toContain("Doctor on Call");
    expect(advice).toContain("Train Ticket Examiner");
    expect(advice).toContain("Meri Saheli");
    expect(advice).toContain("112");
    expect(advice).toContain("RailMadad");
  });
});

describe("Fallback Advisor: General Fallback Behavior", () => {
  it("provides structured overview when intent does not match specific categories", () => {
    const advice = generateDeterministicAdvice("Good morning, help me please");

    expect(advice).toContain("TravelRescue AI Assistant (Offline Mode)");
    expect(advice).toContain("Full Refund & TDR Filing");
    expect(advice).toContain("Alternative Train Recommendations");
    expect(advice).toContain("RAC & Tatkal Rules");
    expect(advice).toContain("Safety & Emergency Support");
  });
});
