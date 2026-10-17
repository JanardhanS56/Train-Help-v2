import { describe, it, expect } from "vitest";
import {
  scanContent,
  redactValue,
  isPlaceholder,
  SECRET_RULES,
} from "../check-secrets.mjs";

describe("Tracked Secret Scanner", () => {
  // Synthesize test tokens strictly at runtime to avoid committing real-looking tokens
  const makeToken = (parts: string[]) => parts.join("");

  const syntheticJwt = makeToken([
    "ey",
    "JhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
    ".ey",
    "JzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4ifQ",
    ".fakeSignatureSegment1234567890",
  ]);

  const syntheticServiceRole = makeToken(["service", "_", "role"]);
  const syntheticPostgresUrl = makeToken([
    "postgres://adminUser:",
    "superSecretSecret999",
    "@database.infra.cloud:5432/production_db",
  ]);
  const syntheticPrivateKey = makeToken([
    "-----BEGIN ",
    "RSA ",
    "PRIVATE ",
    "KEY-----",
  ]);
  const syntheticOpenAiKey = makeToken(["sk-", "abcdef1234567890abcdef1234567890"]);
  const syntheticAnthropicKey = makeToken(["sk-", "ant-", "api03-abcdef1234567890abcdef"]);
  const syntheticGroqKey = makeToken(["gsk_", "abcdef1234567890abcdef1234567890"]);

  it("redacts values properly without echoing full tokens", () => {
    expect(redactValue(syntheticJwt)).toMatch(/^eyJh\.\.\.\[REDACTED\]$/);
    expect(redactValue("abcd")).toBe("[REDACTED]");
    expect(redactValue("")).toBe("[REDACTED]");
  });

  it("detects synthetic JWT token", () => {
    const hits = scanContent("lib/sample.ts", `const token = "${syntheticJwt}";`);
    expect(hits.length).toBe(1);
    expect(hits[0].rule).toBe("JWT Token");
    expect(hits[0].redacted).toContain("[REDACTED]");
    expect(hits[0].line).toBe(1);
  });

  it("detects unauthorized service_role references", () => {
    const hits = scanContent("app/api/auth.ts", `const role = "${syntheticServiceRole}";`);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].rule).toBe("Supabase Service Role Exposure");
  });

  it("allows SUPABASE_SERVICE_ROLE_KEY identifier and SQL DDL role statements", () => {
    const envVarHits = scanContent(
      "scripts/db/seed.ts",
      "const raw = process.env.SUPABASE_SERVICE_ROLE_KEY;"
    );
    expect(envVarHits.length).toBe(0);

    const sqlHits = scanContent(
      "supabase/migrations/0002_migration.sql",
      "CREATE POLICY allow ON trips TO anon, authenticated, service_role;"
    );
    expect(sqlHits.length).toBe(0);
  });

  it("detects unredacted passwords in postgres connection strings", () => {
    const hits = scanContent("scripts/migrate.js", `const url = "${syntheticPostgresUrl}";`);
    expect(hits.length).toBe(1);
    expect(hits[0].rule).toBe("PostgreSQL Password in URL");
  });

  it("ignores placeholder postgres connection URLs", () => {
    const placeholderUrl = "postgresql://postgres:YOUR-PASSWORD@db.YOUR-PROJECT-REF.supabase.co:5432/postgres";
    const hits = scanContent(".env.example", `SUPABASE_DB_URL=${placeholderUrl}`);
    expect(hits.length).toBe(0);
  });

  it("detects private key headers", () => {
    const hits = scanContent("config/key.pem", `${syntheticPrivateKey}\nMIIEpAIBAAKCAQEA...`);
    expect(hits.length).toBe(1);
    expect(hits[0].rule).toBe("Private Key");
  });

  it("detects AI provider API key patterns", () => {
    const openAiHits = scanContent("lib/ai.ts", `const k = "${syntheticOpenAiKey}";`);
    expect(openAiHits.length).toBe(1);
    expect(openAiHits[0].rule).toBe("AI Provider Key Prefix");

    const anthropicHits = scanContent("lib/ai.ts", `const k = "${syntheticAnthropicKey}";`);
    expect(anthropicHits.length).toBe(1);

    const groqHits = scanContent("lib/ai.ts", `const k = "${syntheticGroqKey}";`);
    expect(groqHits.length).toBe(1);
  });

  it("allowlists package-lock.json", () => {
    const hits = scanContent("package-lock.json", `{"integrity": "${syntheticJwt}"}`);
    expect(hits.length).toBe(0);
  });

  it("passes cleanly on normal source code without secrets", () => {
    const hits = scanContent("app/page.tsx", 'export default function Page() { return <div>TravelRescue</div>; }');
    expect(hits.length).toBe(0);
  });

  it("has valid rule regex definitions", () => {
    expect(SECRET_RULES.length).toBeGreaterThanOrEqual(5);
    expect(isPlaceholder("YOUR-PASSWORD")).toBe(true);
    expect(isPlaceholder("realPassword123")).toBe(false);
  });
});
