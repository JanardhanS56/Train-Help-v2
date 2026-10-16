import { SAMPLE_TRAINS } from "./sampleData";

export type DemoPhase = "cancelled" | "analysing" | "alternatives" | "recovered";

export interface DemoState {
  phase: DemoPhase;
  step: number; // 0 to 3
  runId: number;
  chosenId: string | null;
}

export type DemoAction =
  | { type: "START" }
  | { type: "STEP"; runId: number }
  | { type: "CHOOSE"; id: string }
  | { type: "REPLAY" };

export const INITIAL_DEMO_STATE: DemoState = {
  phase: "cancelled",
  step: 0,
  runId: 0,
  chosenId: null,
};

export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case "START": {
      if (state.phase !== "cancelled") {
        return state;
      }
      return {
        ...state,
        phase: "analysing",
        step: 0,
        runId: state.runId + 1,
        chosenId: null,
      };
    }

    case "STEP": {
      if (state.phase !== "analysing" || action.runId !== state.runId) {
        return state;
      }
      const nextStep = state.step + 1;
      if (nextStep >= 3) {
        return {
          ...state,
          phase: "alternatives",
          step: 3,
        };
      }
      return {
        ...state,
        step: nextStep,
      };
    }

    case "CHOOSE": {
      if (state.phase !== "alternatives" || state.chosenId !== null) {
        return state;
      }
      const exists = SAMPLE_TRAINS.some((t) => t.id === action.id);
      if (!exists) {
        return state;
      }
      return {
        ...state,
        phase: "recovered",
        chosenId: action.id,
      };
    }

    case "REPLAY": {
      if (state.phase !== "alternatives" && state.phase !== "recovered") {
        return state;
      }
      return {
        phase: "cancelled",
        step: 0,
        runId: state.runId + 1,
        chosenId: null,
      };
    }

    default:
      return state;
  }
}
