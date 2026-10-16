/**
 * lib/hooks/__tests__/use-online-status.test.ts
 * Unit tests for network resilience and offline detection subscriber.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getOnlineSnapshot, subscribeOnlineStatus } from "../use-online-status";

describe("Network Resilience and Online Status Observer", () => {
  const originalOnLine = typeof navigator !== "undefined" ? navigator.onLine : true;

  beforeEach(() => {
    Object.defineProperty(globalThis.navigator, "onLine", {
      value: true,
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis.navigator, "onLine", {
      value: originalOnLine,
      configurable: true,
      writable: true,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).window;
    vi.restoreAllMocks();
  });

  it("getOnlineSnapshot returns true when navigator.onLine is true", () => {
    Object.defineProperty(globalThis.navigator, "onLine", {
      value: true,
      configurable: true,
    });
    expect(getOnlineSnapshot()).toBe(true);
  });

  it("getOnlineSnapshot returns false when navigator.onLine is false", () => {
    Object.defineProperty(globalThis.navigator, "onLine", {
      value: false,
      configurable: true,
    });
    expect(getOnlineSnapshot()).toBe(false);
  });

  it("subscribes to window 'online' and 'offline' events and invokes listener", () => {
    const listeners: Record<string, () => void> = {};
    const mockWindow = {
      addEventListener: vi.fn((event: string, cb: () => void) => {
        listeners[event] = cb;
      }),
      removeEventListener: vi.fn((event: string) => {
        delete listeners[event];
      }),
    };

    Object.defineProperty(globalThis, "window", {
      value: mockWindow,
      configurable: true,
      writable: true,
    });

    const callback = vi.fn();
    const unsubscribe = subscribeOnlineStatus(callback);

    expect(mockWindow.addEventListener).toHaveBeenCalledWith("online", callback);
    expect(mockWindow.addEventListener).toHaveBeenCalledWith("offline", callback);

    // Simulate offline event
    listeners["offline"]?.();
    expect(callback).toHaveBeenCalledTimes(1);

    // Simulate online event
    listeners["online"]?.();
    expect(callback).toHaveBeenCalledTimes(2);

    // Unsubscribe
    unsubscribe();
    expect(mockWindow.removeEventListener).toHaveBeenCalledWith("online", callback);
    expect(mockWindow.removeEventListener).toHaveBeenCalledWith("offline", callback);
  });
});
