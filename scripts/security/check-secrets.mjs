#!/usr/bin/env node
/**
 * scripts/security/check-secrets.mjs
 * Static secret scanner for repository tracked files.
 *
 * Scans tracked files (via git ls-files) for:
 * 1. JWT-like tokens (eyJ...)
 * 2. service_role secret exposure
 * 3. PostgreSQL connection strings with non-placeholder passwords
 * 4. Private keys (-----BEGIN ... PRIVATE KEY-----)
 * 5. Common AI provider key prefixes (sk-, sk-ant-, sk-proj-, gsk_, nvapi-, AIza)
 *
 * Rules:
 * - Allow-lists package-lock.json
 * - Redacts all matched secret values
 * - Exits with status code 1 with file:line on a hit
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ALLOWLISTED_FILES = new Set([
  "package-lock.json",
]);

export function isPlaceholder(val) {
  if (!val) return true;
  const s = String(val).trim();
  return (
    /YOUR[-_]PROJECT/i.test(s) ||
    /YOUR[-_]PASSWORD/i.test(s) ||
    /YOUR[-_]KEY/i.test(s) ||
    /YOUR[-_]TOKEN/i.test(s) ||
    /placeholder/i.test(s) ||
    /changeme/i.test(s) ||
    /dummy/i.test(s) ||
    /^<[^>]+>$/.test(s) ||
    /^\[[^\]]+\]$/.test(s)
  );
}

export function redactValue(val) {
  if (!val) return "[REDACTED]";
  const str = String(val).trim();
  if (str.length <= 4) return "[REDACTED]";
  return `${str.slice(0, 4)}...[REDACTED]`;
}

export const SECRET_RULES = [
  {
    name: "JWT Token",
    regex: /\beyJ[A-Za-z0-9_-]{10,}(?:\.[A-Za-z0-9_-]{10,})*\b/g,
    test: (match, line, filePath) => {
      if (filePath.endsWith("package-lock.json")) return false;
      return match.length >= 20;
    },
  },
  {
    name: "Supabase Service Role Exposure",
    regex: new RegExp("\\b" + "service" + "_" + "role" + "\\b", "gi"),
    test: (match, line, filePath) => {
      // In SQL migrations, service_role is a PostgreSQL role identifier used in RLS policies and grants
      if (filePath.endsWith(".sql")) {
        return false;
      }
      if (/SUPABASE_SERVICE_ROLE_KEY/i.test(line)) {
        return false;
      }
      // Avoid scanner and test from self-matching when defining or testing the rule
      if (filePath.endsWith("check-secrets.mjs") || filePath.endsWith("check-secrets.test.ts")) {
        return false;
      }
      return true;
    },
  },
  {
    name: "PostgreSQL Password in URL",
    regex: /\bpostgres(?:ql)?:\/\/[^:\s\/]+:([^@\s\/]+)@[^:\s\/]+/gi,
    test: (match) => {
      const parts = match.match(/\bpostgres(?:ql)?:\/\/[^:\s\/]+:([^@\s\/]+)@/i);
      if (!parts || !parts[1]) return false;
      const pwd = parts[1];
      if (isPlaceholder(pwd) || pwd === "password" || pwd === "YOUR-PASSWORD") {
        return false;
      }
      return true;
    },
  },
  {
    name: "Private Key",
    regex: /-----BEGIN\s+(?:[A-Z0-9_-]+\s+)?PRIVATE\s+KEY-----/g,
    test: () => true,
  },
  {
    name: "AI Provider Key Prefix",
    regex: /\b(?:sk-ant-[a-zA-Z0-9_-]{20,}|sk-proj-[a-zA-Z0-9_-]{20,}|sk-[a-zA-Z0-9_-]{20,}|gsk_[a-zA-Z0-9_-]{20,}|nvapi-[a-zA-Z0-9_-]{20,}|AIza[0-9A-Za-z_-]{35})\b/g,
    test: (match) => {
      if (isPlaceholder(match)) return false;
      return true;
    },
  },
  {
    name: "Public Secret Prefix Leak",
    regex: /\bNEXT_PUBLIC_[A-Za-z0-9_]*(?:KEY|SECRET|PASSWORD|TOKEN|DB_URL)[A-Za-z0-9_]*\b/g,
    test: (match, line) => {
      if (match === "NEXT_PUBLIC_SUPABASE_ANON_KEY") {
        return false;
      }
      if (/never prefix with|do not expose/i.test(line)) {
        return false;
      }
      return true;
    },
  },
];

export function scanContent(filePath, content) {
  const normalizedPath = filePath.replace(/\\/g, "/");
  if (ALLOWLISTED_FILES.has(path.basename(normalizedPath)) || ALLOWLISTED_FILES.has(normalizedPath)) {
    return [];
  }

  const lines = content.split(/\r?\n/);
  const findings = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    for (const rule of SECRET_RULES) {
      rule.regex.lastIndex = 0;
      let match;
      while ((match = rule.regex.exec(line)) !== null) {
        const matchedStr = match[0];
        if (rule.test(matchedStr, line, normalizedPath)) {
          findings.push({
            file: normalizedPath,
            line: lineNum,
            rule: rule.name,
            redacted: redactValue(matchedStr),
          });
        }
      }
    }
  }

  return findings;
}

export function scanFile(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const stat = fs.statSync(filePath);
  if (!stat.isFile()) return [];
  if (stat.size > 5 * 1024 * 1024) return [];

  const content = fs.readFileSync(filePath, "utf-8");
  return scanContent(filePath, content);
}

export function getTrackedFiles(cwd = process.cwd()) {
  try {
    const stdout = execSync("git ls-files", { cwd, encoding: "utf-8" });
    return stdout
      .split(/\r?\n/)
      .map((f) => f.trim())
      .filter((f) => f.length > 0 && fs.existsSync(path.resolve(cwd, f)));
  } catch (err) {
    console.error("ERR: Failed to list git tracked files:", err.message);
    return [];
  }
}

export function scanRepository(cwd = process.cwd()) {
  const files = getTrackedFiles(cwd);
  const allFindings = [];

  for (const file of files) {
    const fullPath = path.resolve(cwd, file);
    const findings = scanFile(fullPath);
    for (const f of findings) {
      allFindings.push({
        ...f,
        file,
      });
    }
  }

  return allFindings;
}

export function main() {
  console.log("==================================================");
  console.log("TravelRescue AI: Tracked Secrets Scanner");
  console.log("==================================================");

  const findings = scanRepository();

  if (findings.length === 0) {
    console.log("✓ No committed secrets found across tracked files.");
    console.log("==================================================");
    process.exit(0);
  }

  console.error(`\n❌ Found ${findings.length} potential secret(s) in tracked repository files:\n`);
  for (const hit of findings) {
    console.error(`  ${hit.file}:${hit.line}: [${hit.rule}] ${hit.redacted}`);
  }
  console.error("\nPlease remove these credentials, rotate exposed keys, and use .env.local instead.");
  console.error("==================================================");
  process.exit(1);
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(currentFile)) {
  main();
}
