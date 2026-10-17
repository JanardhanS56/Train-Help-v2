import { describe, it, expect } from "vitest";
import {
  isPlaceholder,
  maskSecret,
  getHostOnly,
  assertValidSecret,
} from "../env-helper";

describe("Database Scripts Security Env Helper", () => {
  it("identifies placeholder and dummy values correctly", () => {
    expect(isPlaceholder("")).toBe(true);
    expect(isPlaceholder("   ")).toBe(true);
    expect(isPlaceholder(undefined)).toBe(true);
    expect(isPlaceholder(null)).toBe(true);
    expect(isPlaceholder("https://YOUR-PROJECT-REF.supabase.co")).toBe(true);
    expect(isPlaceholder("YOUR-SERVICE-ROLE-KEY")).toBe(true);
    expect(isPlaceholder("YOUR-ANON-KEY")).toBe(true);
    expect(isPlaceholder("YOUR-PASSWORD")).toBe(true);
    expect(isPlaceholder("placeholder")).toBe(true);
    expect(isPlaceholder("<your-token>")).toBe(true);
    expect(isPlaceholder("[your-token]")).toBe(true);
    expect(isPlaceholder("changeme")).toBe(true);
    expect(isPlaceholder("example")).toBe(true);

    // Valid looking values
    expect(isPlaceholder("https://abcdefghijklm.supabase.co")).toBe(false);
    expect(isPlaceholder("real-secret-token-12345")).toBe(false);
  });

  it("masks secrets to at most 4 characters without leaking full token", () => {
    expect(maskSecret("")).toBe("(not set)");
    expect(maskSecret(undefined)).toBe("(not set)");
    expect(maskSecret("123")).toBe("[REDACTED]");
    expect(maskSecret("1234")).toBe("[REDACTED]");
    expect(maskSecret("secretKey123456789")).toBe("secr...[REDACTED]");
  });

  it("extracts only the host name and avoids printing credentials or paths", () => {
    expect(getHostOnly(undefined)).toBe("(none)");
    expect(getHostOnly("")).toBe("(none)");
    expect(getHostOnly("not a url")).toBe("(invalid-url)");
    expect(getHostOnly("https://myproject.supabase.co")).toBe("myproject.supabase.co");
    expect(getHostOnly("postgres://postgres:password123@db.myproject.supabase.co:5432/postgres")).toBe("db.myproject.supabase.co:5432");
  });

  it("assertValidSecret throws clear error for missing or placeholder credentials", () => {
    expect(() => assertValidSecret("API_KEY", "")).toThrow(/Missing required variable/);
    expect(() => assertValidSecret("API_KEY", "YOUR-API-KEY")).toThrow(/contains placeholder value/);
    expect(assertValidSecret("API_KEY", "valid-api-token")).toBe("valid-api-token");
  });
});
