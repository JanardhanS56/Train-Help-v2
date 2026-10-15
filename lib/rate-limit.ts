import { NextResponse } from "next/server";

export interface RateLimitEntry {
  timestamps: number[];
  blockedUntil: number | null;
}

export interface RateLimitConfig {
  /** Maximum requests allowed within the window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Optional: block duration in ms after limit is exceeded (default: windowMs) */
  blockDurationMs?: number;
  /** Identifier for this limiter (for logging) */
  name?: string;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetMs: number;
  retryAfterMs?: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

let cleanupScheduled = false;

function getStore(name: string): Map<string, RateLimitEntry> {
  if (!stores.has(name)) {
    stores.set(name, new Map());
  }
  return stores.get(name)!;
}

/** Reset in-memory rate limit stores (useful in test suites) */
export function resetRateLimitStoreForTesting(): void {
  stores.clear();
}

function scheduleCleanup() {
  if (cleanupScheduled) return;
  cleanupScheduled = true;
  // Clean up stale entries every 60 seconds
  if (typeof globalThis !== "undefined") {
    setInterval(() => {
      const now = Date.now();
      for (const [, store] of stores) {
        for (const [key, entry] of store) {
          // Remove entries with no recent timestamps and not blocked
          const freshTimestamps = entry.timestamps.filter(
            (t) => now - t < 300_000 // 5 minute max retention
          );
          if (
            freshTimestamps.length === 0 &&
            (!entry.blockedUntil || entry.blockedUntil < now)
          ) {
            store.delete(key);
          }
        }
      }
    }, 60_000);
  }
}

/**
 * Check and consume a rate limit token for the given identifier.
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const {
    maxRequests,
    windowMs,
    blockDurationMs = windowMs,
    name = "default",
  } = config;

  scheduleCleanup();

  const store = getStore(name);
  const now = Date.now();

  let entry = store.get(identifier);
  if (!entry) {
    entry = { timestamps: [], blockedUntil: null };
    store.set(identifier, entry);
  }

  // Check if currently blocked
  if (entry.blockedUntil && now < entry.blockedUntil) {
    return {
      success: false,
      remaining: 0,
      resetMs: entry.blockedUntil - now,
      retryAfterMs: entry.blockedUntil - now,
    };
  }

  // Clear block if expired
  if (entry.blockedUntil && now >= entry.blockedUntil) {
    entry.blockedUntil = null;
    entry.timestamps = [];
  }

  // Remove timestamps outside the current window
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= maxRequests) {
    // Rate limit exceeded — block
    entry.blockedUntil = now + blockDurationMs;
    return {
      success: false,
      remaining: 0,
      resetMs: blockDurationMs,
      retryAfterMs: blockDurationMs,
    };
  }

  // Allow request
  entry.timestamps.push(now);
  const remaining = maxRequests - entry.timestamps.length;
  const oldestInWindow = entry.timestamps[0] || now;
  const resetMs = windowMs - (now - oldestInWindow);

  return {
    success: true,
    remaining,
    resetMs,
  };
}

/**
 * Extract a client identifier from a Next.js request.
 * Uses x-forwarded-for → x-real-ip → fallback "anonymous".
 */
export function getClientIdentifier(
  headers: Headers
): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "anonymous";
}

/**
 * Convenience helper to return a standardized 429 JSON response with rate limit headers.
 */
export function createRateLimitResponse(
  limit: RateLimitResult,
  customMessage?: string
): NextResponse {
  const retrySec = Math.max(1, Math.ceil((limit.retryAfterMs ?? 30_000) / 1000));
  return NextResponse.json(
    {
      error:
        customMessage ||
        `Rate limit exceeded. Please wait ${retrySec} second${retrySec === 1 ? "" : "s"} before retrying.`,
      isError: true,
      retryAfterMs: limit.retryAfterMs,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retrySec),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil(limit.resetMs / 1000)),
      },
    }
  );
}

// ─── Pre-configured limiters ───────────────────────────────────────

/** Chat API: 10 requests per 60 seconds per IP */
export const CHAT_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 10,
  windowMs: 60_000,
  blockDurationMs: 30_000,
  name: "chat-api",
};

/** Simulation Advise API: 15 requests per 60 seconds per IP */
export const ADVISE_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 15,
  windowMs: 60_000,
  blockDurationMs: 20_000,
  name: "sim-advise",
};

/** General API: 60 requests per 60 seconds per IP */
export const GENERAL_API_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 60,
  windowMs: 60_000,
  blockDurationMs: 15_000,
  name: "general-api",
};

/** Supabase DB queries: 30 requests per 60 seconds per IP */
export const DB_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 30,
  windowMs: 60_000,
  blockDurationMs: 20_000,
  name: "db-queries",
};
