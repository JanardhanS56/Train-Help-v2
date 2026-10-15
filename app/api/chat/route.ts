import { NextRequest, NextResponse } from "next/server";
import { executeAIChat, getProviderConfig } from "@/lib/ai/providers";
import { AIChatMessage } from "@/lib/ai/types";
import { CHAT_RATE_LIMIT, enforceRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const rateLimit = await enforceRateLimit(req, CHAT_RATE_LIMIT);
  if (!rateLimit.success) return rateLimit.response;

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
          "X-RateLimit-Remaining": String(rateLimit.limit.remaining),
          "X-RateLimit-Reset": String(Math.ceil(rateLimit.limit.resetMs / 1000)),
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
