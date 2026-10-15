import { NextRequest, NextResponse } from "next/server";
import { executeAIChat, getProviderConfig } from "@/lib/ai/providers";
import { AIChatMessage } from "@/lib/ai/types";
import { checkRateLimit, getClientIdentifier, CHAT_RATE_LIMIT } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // ── Rate limiting ──────────────────────────────────────────────
  const clientId = getClientIdentifier(req.headers);
  const limit = checkRateLimit(clientId, CHAT_RATE_LIMIT);

  if (!limit.success) {
    return NextResponse.json(
      {
        error: `Rate limit exceeded. Please wait ${Math.ceil((limit.retryAfterMs ?? 30_000) / 1000)} seconds before sending another message.`,
        isError: true,
        retryAfterMs: limit.retryAfterMs,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((limit.retryAfterMs ?? 30_000) / 1000)),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(limit.resetMs / 1000)),
        },
      }
    );
  }

  try {
    const body = await req.json();
    const messages: AIChatMessage[] = body.messages || [];

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Invalid request: messages array is required." },
        { status: 400 }
      );
    }

    // Limit message history length to prevent oversized payloads
    const trimmedMessages = messages.slice(-20);

    const config = getProviderConfig();
    const result = await executeAIChat(trimmedMessages, config);

    return NextResponse.json(
      {
        reply: result.text,
        provider: result.provider,
        model: result.model,
        isMock: result.isMock,
      },
      {
        headers: {
          "X-RateLimit-Remaining": String(limit.remaining),
          "X-RateLimit-Reset": String(Math.ceil(limit.resetMs / 1000)),
        },
      }
    );
  } catch (error: unknown) {
    const err = error as Error;
    const errorMessage = err.message || "An unexpected error occurred.";
    let status = 500;

    if (errorMessage.includes("401") || errorMessage.includes("Authentication")) {
      status = 401;
    } else if (errorMessage.includes("429") || errorMessage.includes("Rate limit")) {
      status = 429;
    } else if (errorMessage.includes("timed out")) {
      status = 504;
    }

    return NextResponse.json(
      {
        error: errorMessage,
        isError: true,
      },
      { status }
    );
  }
}
