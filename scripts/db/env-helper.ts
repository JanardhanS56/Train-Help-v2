/**
 * scripts/db/env-helper.ts
 * Shared security-hardened environment and secret helper for database scripts.
 *
 * Rules:
 * 1. Reads environment only from process.env and .env.local (never reads .env.example or fallback files).
 * 2. Detects placeholder patterns and prevents script execution with dummy tokens.
 * 3. Never echoes secrets in plain text: masks to at most first 4 characters.
 * 4. Extracts and prints only target project hosts, never credential-bearing URLs.
 */

import * as fs from "fs";
import * as path from "path";

const PLACEHOLDER_PATTERNS = [
  /YOUR[-_]PROJECT[-_]REF/i,
  /YOUR[-_]PASSWORD/i,
  /YOUR[-_]ANON[-_]KEY/i,
  /YOUR[-_]SERVICE[-_]ROLE[-_]KEY/i,
  /YOUR[-_]API[-_]KEY/i,
  /your[-_]project/i,
  /your[-_]anon/i,
  /your[-_]service/i,
  /<[^>]+>/,
  /\[[^\]]+\]/,
  /placeholder/i,
  /changeme/i,
  /dummy/i,
  /example/i,
];

export function isPlaceholder(val: string | undefined | null): boolean {
  if (!val) return true;
  const trimmed = val.trim();
  if (trimmed === "") return true;
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export function maskSecret(val: string | undefined | null): string {
  if (!val || val.trim() === "") return "(not set)";
  const trimmed = val.trim();
  if (trimmed.length <= 4) return "[REDACTED]";
  return `${trimmed.slice(0, 4)}...[REDACTED]`;
}

export function getHostOnly(urlStr: string | undefined | null): string {
  if (!urlStr || urlStr.trim() === "") return "(none)";
  try {
    const parsed = new URL(urlStr.trim());
    return parsed.host || parsed.hostname || "(unknown-host)";
  } catch {
    return "(invalid-url)";
  }
}

export function loadEnvLocal(): void {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

export function assertValidSecret(
  name: string,
  val: string | undefined | null,
  contextHelp?: string
): string {
  if (!val || val.trim() === "") {
    const help = contextHelp ? `\n${contextHelp}` : "";
    throw new Error(`ERR: Missing required variable '${name}'. Please set it in .env.local.${help}`);
  }
  if (isPlaceholder(val)) {
    const help = contextHelp ? `\n${contextHelp}` : "";
    throw new Error(
      `ERR: Variable '${name}' contains placeholder value. Please set a real credential in .env.local.${help}`
    );
  }
  return val.trim();
}
