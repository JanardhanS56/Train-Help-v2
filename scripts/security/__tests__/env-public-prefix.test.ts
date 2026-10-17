import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

// Allowed public client variables
const ALLOWED_PUBLIC_VARS = new Set([
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_APP_URL",
]);

// Secret indicators that must NEVER have a NEXT_PUBLIC_ prefix
const FORBIDDEN_SECRET_SUBSTRINGS = [
  "SECRET",
  "PASSWORD",
  "TOKEN",
  "DB_URL",
  "SERVICE_ROLE",
];

export function findPublicPrefixViolations(filePath: string, content: string): { line: number; variable: string }[] {
  const violations: { line: number; variable: string }[] = [];
  const lines = content.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Ignore comments warning against NEXT_PUBLIC_
    if (/never prefix with|do not expose/i.test(line)) {
      continue;
    }

    const matches = line.matchAll(/\bNEXT_PUBLIC_([A-Za-z0-9_]+)\b/g);
    for (const match of matches) {
      const fullVar = match[0];
      const suffix = match[1];

      // If it's an explicitly allowed public variable, pass
      if (ALLOWED_PUBLIC_VARS.has(fullVar)) {
        continue;
      }

      // Check if named like a secret
      const isSecretLike =
        FORBIDDEN_SECRET_SUBSTRINGS.some((secretWord) => suffix.includes(secretWord)) ||
        (suffix.includes("KEY") && fullVar !== "NEXT_PUBLIC_SUPABASE_ANON_KEY");

      if (isSecretLike) {
        violations.push({ line: i + 1, variable: fullVar });
      }
    }
  }

  return violations;
}

describe("Security Guard: NEXT_PUBLIC_ Secret Prefix Enforcement", () => {
  it("rejects forbidden secret patterns when prefixed with NEXT_PUBLIC_", () => {
    const badCode = `
      const serviceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
      const dbUrl = process.env.NEXT_PUBLIC_DB_URL;
      const secret = process.env.NEXT_PUBLIC_APP_SECRET;
      const pwd = process.env.NEXT_PUBLIC_REDIS_PASSWORD;
      const token = process.env.NEXT_PUBLIC_AUTH_TOKEN;
      const aiKey = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY;
    `;

    const violations = findPublicPrefixViolations("test.ts", badCode);
    const varNames = violations.map((v) => v.variable);

    expect(varNames).toContain("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY");
    expect(varNames).toContain("NEXT_PUBLIC_DB_URL");
    expect(varNames).toContain("NEXT_PUBLIC_APP_SECRET");
    expect(varNames).toContain("NEXT_PUBLIC_REDIS_PASSWORD");
    expect(varNames).toContain("NEXT_PUBLIC_AUTH_TOKEN");
    expect(varNames).toContain("NEXT_PUBLIC_DEEPSEEK_API_KEY");
  });

  it("permits verified safe public variables like NEXT_PUBLIC_SUPABASE_ANON_KEY and URLs", () => {
    const safeCode = `
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    `;

    const violations = findPublicPrefixViolations("test.ts", safeCode);
    expect(violations.length).toBe(0);
  });

  it("verifies .env.example contains no secret-like variables prefixed with NEXT_PUBLIC_", () => {
    const envExamplePath = path.resolve(process.cwd(), ".env.example");
    expect(fs.existsSync(envExamplePath)).toBe(true);

    const content = fs.readFileSync(envExamplePath, "utf-8");
    const violations = findPublicPrefixViolations(".env.example", content);
    expect(violations).toEqual([]);
  });

  it("verifies all tracked repository code files contain no secret-like NEXT_PUBLIC_ variables", () => {
    let trackedFiles: string[] = [];
    try {
      const stdout = execSync("git ls-files", { encoding: "utf-8" });
      trackedFiles = stdout
        .split(/\r?\n/)
        .map((f) => f.trim())
        .filter((f) => /\.(ts|tsx|js|mjs|py|env\w*)$/i.test(f) && !f.includes("env-public-prefix.test.ts"));
    } catch {
      // fallback
      trackedFiles = [".env.example"];
    }

    const allViolations: { file: string; line: number; variable: string }[] = [];

    for (const relFile of trackedFiles) {
      const fullPath = path.resolve(process.cwd(), relFile);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, "utf-8");
        const violations = findPublicPrefixViolations(relFile, content);
        for (const v of violations) {
          allViolations.push({ file: relFile, ...v });
        }
      }
    }

    expect(allViolations).toEqual([]);
  });
});
