import { describe, it, expect, beforeEach } from "vitest";
import {
  checkRateLimit,
  getClientIdentifier,
  createRateLimitResponse,
  resetRateLimitStoreForTesting,
  RateLimitConfig,
} from "@/lib/rate-limit";

describe("Rate Limiting Engine", () => {
  beforeEach(() => {
    resetRateLimitStoreForTesting();
  });

  it("permits requests within configured window and threshold", () => {
    const config: RateLimitConfig = {
      maxRequests: 3,
      windowMs: 10_000,
      name: "test-allow",
    };

    const res1 = checkRateLimit("client-1", config);
    expect(res1.success).toBe(true);
    expect(res1.remaining).toBe(2);

    const res2 = checkRateLimit("client-1", config);
    expect(res2.success).toBe(true);
    expect(res2.remaining).toBe(1);

    const res3 = checkRateLimit("client-1", config);
    expect(res3.success).toBe(true);
    expect(res3.remaining).toBe(0);
  });

  it("blocks requests once rate limit is exceeded", () => {
    const config: RateLimitConfig = {
      maxRequests: 2,
      windowMs: 5_000,
      blockDurationMs: 8_000,
      name: "test-block",
    };

    checkRateLimit("client-2", config);
    checkRateLimit("client-2", config);

    // Third request exceeds limit
    const blockedRes = checkRateLimit("client-2", config);
    expect(blockedRes.success).toBe(false);
    expect(blockedRes.remaining).toBe(0);
    expect(blockedRes.retryAfterMs).toBeGreaterThan(0);
    expect(blockedRes.retryAfterMs).toBeLessThanOrEqual(8000);
  });

  it("isolates different client identifiers", () => {
    const config: RateLimitConfig = {
      maxRequests: 1,
      windowMs: 5_000,
      name: "test-isolation",
    };

    const clientA = checkRateLimit("192.168.1.1", config);
    expect(clientA.success).toBe(true);

    const clientASecond = checkRateLimit("192.168.1.1", config);
    expect(clientASecond.success).toBe(false);

    // Client B should still succeed
    const clientB = checkRateLimit("192.168.1.2", config);
    expect(clientB.success).toBe(true);
  });

  it("correctly parses client identifier from proxy and ip headers", () => {
    const headers1 = new Headers({ "x-forwarded-for": "203.0.113.195, 70.41.3.18" });
    expect(getClientIdentifier(headers1)).toBe("203.0.113.195");

    const headers2 = new Headers({ "x-real-ip": "198.51.100.4" });
    expect(getClientIdentifier(headers2)).toBe("198.51.100.4");

    const headers3 = new Headers({});
    expect(getClientIdentifier(headers3)).toBe("anonymous");
  });

  it("constructs standard 429 response with proper headers", async () => {
    const limit = {
      success: false,
      remaining: 0,
      resetMs: 15_000,
      retryAfterMs: 15_000,
    };

    const res = createRateLimitResponse(limit, "Custom rate limit error");
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("15");
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("0");

    const data = await res.json();
    expect(data.error).toBe("Custom rate limit error");
    expect(data.isError).toBe(true);
    expect(data.retryAfterMs).toBe(15_000);
  });
});
