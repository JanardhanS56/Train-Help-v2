import { describe, it, expect } from "vitest";
import {
  SAMPLE_TRAINS,
  deriveDurationMinutes,
  deriveDurationString,
  rankTrains,
} from "../sampleData";
import { demoReducer, INITIAL_DEMO_STATE, DemoState } from "../demo-reducer";

describe("Landing Demo Pure Functions & Comparator", () => {
  it("derives duration accurately across midnight and day offsets", () => {
    // 20:00 day 0 to 05:30 day 2 -> 4h + 24h + 5.5h = 33h 30m = 2010 min
    const minsRajdhani = deriveDurationMinutes("20:00", "05:30", 2);
    expect(minsRajdhani).toBe(2010);
    expect(deriveDurationString("20:00", "05:30", 2)).toBe("33h 30m");

    // 16:30 day 0 to 09:15 day 2 -> 7.5h + 24h + 9.25h = 40h 45m = 2445 min
    const minsSampark = deriveDurationMinutes("16:30", "09:15", 2);
    expect(minsSampark).toBe(2445);
    expect(deriveDurationString("16:30", "09:15", 2)).toBe("40h 45m");
  });

  it("ranks trains correctly for budget thresholds", () => {
    // Budget 3500 -> all 3 eligible, best is 'a' (CNF)
    const res3500 = rankTrains(SAMPLE_TRAINS, 3500);
    expect(res3500.best?.train.id).toBe("a");
    expect(res3500.eligible.length).toBe(3);
    expect(res3500.ineligible.length).toBe(0);

    // Budget 2000 -> 'a' (fare 3150) is over budget, eligible are 'b' (1780) & 'c' (1420), best is 'b' (RAC vs WL)
    const res2000 = rankTrains(SAMPLE_TRAINS, 2000);
    expect(res2000.best?.train.id).toBe("b");
    expect(res2000.eligible.map((i) => i.train.id)).toEqual(["b", "c"]);
    expect(res2000.ineligible.map((i) => i.train.id)).toEqual(["a"]);

    // Budget 1420 -> only 'c' (1420) is eligible, best is 'c'
    const res1420 = rankTrains(SAMPLE_TRAINS, 1420);
    expect(res1420.best?.train.id).toBe("c");
    expect(res1420.eligible.length).toBe(1);
    expect(res1420.ineligible.length).toBe(2);

    // Budget 1000 -> none eligible, best is null
    const res1000 = rankTrains(SAMPLE_TRAINS, 1000);
    expect(res1000.best).toBeNull();
    expect(res1000.eligible.length).toBe(0);
    expect(res1000.ineligible.length).toBe(3);
  });
});

describe("Landing Demo useReducer State Machine", () => {
  it("executes valid happy-path transitions", () => {
    let state = INITIAL_DEMO_STATE;
    expect(state.phase).toBe("cancelled");

    // START
    state = demoReducer(state, { type: "START" });
    expect(state.phase).toBe("analysing");
    expect(state.step).toBe(0);
    expect(state.runId).toBe(1);

    // STEP 1
    state = demoReducer(state, { type: "STEP", runId: 1 });
    expect(state.step).toBe(1);
    expect(state.phase).toBe("analysing");

    // STEP 2
    state = demoReducer(state, { type: "STEP", runId: 1 });
    expect(state.step).toBe(2);
    expect(state.phase).toBe("analysing");

    // STEP 3 -> transition to alternatives
    state = demoReducer(state, { type: "STEP", runId: 1 });
    expect(state.step).toBe(3);
    expect(state.phase).toBe("alternatives");

    // CHOOSE valid train
    state = demoReducer(state, { type: "CHOOSE", id: "b" });
    expect(state.phase).toBe("recovered");
    expect(state.chosenId).toBe("b");

    // REPLAY from recovered
    state = demoReducer(state, { type: "REPLAY" });
    expect(state.phase).toBe("cancelled");
    expect(state.step).toBe(0);
    expect(state.chosenId).toBeNull();
    expect(state.runId).toBe(2);
  });

  it("ignores invalid actions and maintains purity", () => {
    const cancelled = INITIAL_DEMO_STATE;

    // STEP while cancelled is ignored
    expect(demoReducer(cancelled, { type: "STEP", runId: 0 })).toBe(cancelled);

    // CHOOSE while cancelled is ignored
    expect(demoReducer(cancelled, { type: "CHOOSE", id: "a" })).toBe(cancelled);

    // REPLAY while cancelled is ignored
    expect(demoReducer(cancelled, { type: "REPLAY" })).toBe(cancelled);
  });

  it("drops stale runId steps", () => {
    let state = INITIAL_DEMO_STATE;
    state = demoReducer(state, { type: "START" }); // runId: 1
    expect(state.runId).toBe(1);

    // Step with wrong runId: 99
    const afterStale = demoReducer(state, { type: "STEP", runId: 99 });
    expect(afterStale.step).toBe(0);
  });

  it("guards against double CHOOSE in alternatives", () => {
    let state: DemoState = {
      phase: "alternatives",
      step: 3,
      runId: 1,
      chosenId: null,
    };

    state = demoReducer(state, { type: "CHOOSE", id: "a" });
    expect(state.phase).toBe("recovered");
    expect(state.chosenId).toBe("a");

    // Second CHOOSE attempt should be rejected
    const secondChoose = demoReducer(state, { type: "CHOOSE", id: "b" });
    expect(secondChoose.chosenId).toBe("a");
    expect(secondChoose.phase).toBe("recovered");
  });

  it("rejects non-existent train id on CHOOSE", () => {
    const state: DemoState = {
      phase: "alternatives",
      step: 3,
      runId: 1,
      chosenId: null,
    };

    const nextState = demoReducer(state, { type: "CHOOSE", id: "non-existent" });
    expect(nextState.phase).toBe("alternatives");
    expect(nextState.chosenId).toBeNull();
  });
});
