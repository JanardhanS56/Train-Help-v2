import { describe, it, expect } from "vitest";

describe("Anti-Spam Click Throttler Logic", () => {
  it("prevents execution within cooldown threshold", async () => {
    let lastClick = 0;
    const cooldownMs = 500;
    let executionCount = 0;

    function handleClick() {
      const now = Date.now();
      if (now - lastClick < cooldownMs) {
        return false;
      }
      lastClick = now;
      executionCount++;
      return true;
    }

    // First click should succeed
    expect(handleClick()).toBe(true);
    expect(executionCount).toBe(1);

    // Rapid successive click within 500ms should be rejected
    expect(handleClick()).toBe(false);
    expect(executionCount).toBe(1);
  });
});
