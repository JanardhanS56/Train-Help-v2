import { NextRequest, NextResponse } from "next/server";
import { getProviderConfig } from "@/lib/ai/providers";
import { buildGroundedSystemPrompt, type GroundingContext } from "@/lib/ai/grounding";
import { parseStructuredActions } from "@/lib/ai/action-parser";
import { saveChatMessage } from "@/lib/data/chat";
import { CHAT_RATE_LIMIT, enforceRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export interface ChatRequestBody {
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  conversationId?: string;
  context?: GroundingContext;
  stream?: boolean;
}

export async function POST(req: NextRequest) {
  const rateLimit = await enforceRateLimit(req, CHAT_RATE_LIMIT);
  if (!rateLimit.success) return rateLimit.response;

  try {
    const body: ChatRequestBody = await req.json();
    const messages = body.messages || [];
    const conversationId = body.conversationId || "default-session";
    const groundingContext = body.context || {};
    const wantsStream = body.stream !== false; // Default to streaming

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Invalid request: messages array is required." },
        { status: 400 }
      );
    }

    // Check for DeepSeek / AI API key
    const config = getProviderConfig();
    const apiKey = process.env.DEEPSEEK_API_KEY || config.apiKey;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "DEEPSEEK_API_KEY is not configured in the environment. Please add DEEPSEEK_API_KEY to your .env.local file to enable the live AI assistant.",
          isError: true,
          code: "MISSING_API_KEY",
        },
        { status: 503 }
      );
    }

    // Save latest user message to Supabase / store
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMsg) {
      await saveChatMessage({
        conversation_id: conversationId,
        role: "user",
        content: lastUserMsg.content,
      }).catch((e) => console.warn("Failed to persist user chat message:", e));
    }

    // Build grounded system prompt with live session context
    const systemPrompt = buildGroundedSystemPrompt(groundingContext);

    // Limit conversation history to latest 15 messages
    const trimmedMessages = messages.slice(-15).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const payloadMessages = [
      { role: "system", content: systemPrompt },
      ...trimmedMessages,
    ];

    const endpointUrl = config.baseUrl || "https://api.deepseek.com/v1/chat/completions";
    const model = config.model || "deepseek-chat";

    if (!wantsStream) {
      // Non-streaming fallback for tests or specific callers
      const res = await fetch(endpointUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: payloadMessages,
          temperature: 0.3,
          max_tokens: 1024,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        return NextResponse.json(
          { error: `Upstream AI provider error: ${errorText}`, isError: true },
          { status: res.status }
        );
      }

      const json = await res.json();
      const rawReply = json.choices?.[0]?.message?.content || "";
      const { cleanContent, actions } = parseStructuredActions(rawReply);

      // Persist assistant message
      await saveChatMessage({
        conversation_id: conversationId,
        role: "assistant",
        content: cleanContent,
        actions,
      }).catch((e) => console.warn("Failed to persist assistant chat message:", e));

      return NextResponse.json({
        reply: cleanContent,
        rawReply,
        actions,
        provider: config.provider,
        model,
      });
    }

    // Streaming SSE Mode
    const upstreamRes = await fetch(endpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: payloadMessages,
        temperature: 0.3,
        max_tokens: 1024,
        stream: true,
      }),
    });

    if (!upstreamRes.ok) {
      const errorText = await upstreamRes.text();
      return NextResponse.json(
        { error: `Upstream AI provider error: ${errorText}`, isError: true },
        { status: upstreamRes.status }
      );
    }

    if (!upstreamRes.body) {
      return NextResponse.json(
        { error: "No response stream received from AI provider", isError: true },
        { status: 502 }
      );
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let accumulatedText = "";

    const stream = new ReadableStream({
      async start(controller) {
        const reader = upstreamRes.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed.startsWith(":")) continue;

              if (trimmed === "data: [DONE]") {
                continue;
              }

              if (trimmed.startsWith("data:")) {
                const jsonStr = trimmed.slice(5).trim();
                try {
                  const parsed = JSON.parse(jsonStr);
                  const delta = parsed.choices?.[0]?.delta?.content || "";
                  if (delta) {
                    accumulatedText += delta;
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ token: delta, done: false })}\n\n`)
                    );
                  }
                } catch {
                  // Skip unparseable chunks
                }
              }
            }
          }

          // Parse final actions
          const { cleanContent, actions } = parseStructuredActions(accumulatedText);

          // Save assistant message to Supabase
          await saveChatMessage({
            conversation_id: conversationId,
            role: "assistant",
            content: cleanContent,
            actions,
          }).catch((e) => console.warn("Failed to persist assistant chat message:", e));

          // Send final completion event with parsed actions
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                token: "",
                done: true,
                cleanContent,
                actions,
                provider: config.provider,
                model,
              })}\n\n`
            )
          );
        } catch (streamErr) {
          console.error("Error during streaming SSE:", streamErr);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: "Stream interrupted", done: true })}\n\n`)
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-RateLimit-Remaining": String(rateLimit.limit.remaining),
        "X-RateLimit-Reset": String(Math.ceil(rateLimit.limit.resetMs / 1000)),
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    const errorMessage = err.message || "An unexpected error occurred in AI chat.";
    return NextResponse.json(
      { error: errorMessage, isError: true },
      { status: 500 }
    );
  }
}
