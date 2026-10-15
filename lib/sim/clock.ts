/**
 * lib/sim/clock.ts
 * Deterministic virtual clock for step, play/pause, scrub, and time acceleration.
 */

import type { SimScheduleStop } from "./types";

export type SpeedMultiplier = 1 | 10 | 60 | 300;

export interface ClockState {
  currentMinute: number;
  isPlaying: boolean;
  speedMultiplier: SpeedMultiplier;
  startMinute: number;
  endMinute: number;
}

export function createInitialClock(startMinute: number, endMinute: number): ClockState {
  return {
    currentMinute: startMinute,
    isPlaying: false,
    speedMultiplier: 10,
    startMinute,
    endMinute,
  };
}

export function stepClock(state: ClockState, deltaMinutes: number): ClockState {
  const nextMin = Math.max(state.startMinute, Math.min(state.endMinute, state.currentMinute + deltaMinutes));
  return {
    ...state,
    currentMinute: nextMin,
    isPlaying: nextMin >= state.endMinute ? false : state.isPlaying,
  };
}

export function stepToNextStation(state: ClockState, stops: SimScheduleStop[]): ClockState {
  const nextStop = stops.find((s) => s.arrivalMin > state.currentMinute);
  if (!nextStop) {
    return { ...state, currentMinute: state.endMinute, isPlaying: false };
  }
  return { ...state, currentMinute: nextStop.arrivalMin };
}

export function scrubClock(state: ClockState, targetMinute: number): ClockState {
  const clamped = Math.max(state.startMinute, Math.min(state.endMinute, targetMinute));
  return {
    ...state,
    currentMinute: clamped,
  };
}
