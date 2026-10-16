/**
 * lib/sim/__tests__/soundscape.test.ts
 * Unit tests for simulation Web Audio API soundscape synthesizer.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { simSoundscape } from "../soundscape";

describe("Simulation Web Audio Soundscape Engine", () => {
  const localStorageStore: Record<string, string> = {};

  beforeEach(() => {
    // Clear storage
    for (const key in localStorageStore) delete localStorageStore[key];

    // Mock localStorage
    Object.defineProperty(globalThis, "localStorage", {
      value: {
        getItem: vi.fn((key: string) => localStorageStore[key] ?? null),
        setItem: vi.fn((key: string, val: string) => {
          localStorageStore[key] = val;
        }),
        removeItem: vi.fn((key: string) => {
          delete localStorageStore[key];
        }),
      },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("defaults to muted on initial instantiation (browser autoplay policy)", () => {
    // Should default to muted when no storage preference exists
    simSoundscape.setMuted(true);
    expect(simSoundscape.getMuted()).toBe(true);
  });

  it("persists mute state changes to localStorage", () => {
    simSoundscape.setMuted(false);
    expect(simSoundscape.getMuted()).toBe(false);
    expect(globalThis.localStorage.setItem).toHaveBeenCalledWith(
      "travelrescue_sim_muted",
      "false"
    );

    simSoundscape.setMuted(true);
    expect(simSoundscape.getMuted()).toBe(true);
    expect(globalThis.localStorage.setItem).toHaveBeenCalledWith(
      "travelrescue_sim_muted",
      "true"
    );
  });

  it("executes sound cue methods without throwing errors when muted", () => {
    simSoundscape.setMuted(true);

    expect(() => {
      simSoundscape.playDepartureChime();
      simSoundscape.playAdvisorDing();
      simSoundscape.playObstacleSiren();
      simSoundscape.startWheelRoll(10);
      simSoundscape.stopWheelRoll();
    }).not.toThrow();
  });

  it("handles Web Audio synthesis gracefully with mock AudioContext", () => {
    const mockOscillator = {
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      type: "sine",
      frequency: { setValueAtTime: vi.fn() },
    };

    const mockGain = {
      connect: vi.fn(),
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
    };

    class MockAudioContext {
      state = "running";
      currentTime = 10;
      destination = {};
      createOscillator = vi.fn(() => mockOscillator);
      createGain = vi.fn(() => mockGain);
      resume = vi.fn().mockResolvedValue(undefined);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).AudioContext = MockAudioContext;

    simSoundscape.setMuted(false);

    expect(() => {
      simSoundscape.playDepartureChime();
      simSoundscape.playAdvisorDing();
      simSoundscape.playObstacleSiren();
    }).not.toThrow();

    // Re-mute after test
    simSoundscape.setMuted(true);
  });
});
