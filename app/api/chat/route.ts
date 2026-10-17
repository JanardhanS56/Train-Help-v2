import { NextRequest, NextResponse } from "next/server";
import { getProviderConfig } from "@/lib/ai/providers";
import { buildGroundedSystemPrompt, type GroundingContext } from "@/lib/ai/grounding";
import { parseStructuredActions } from "@/lib/ai/action-parser";
import { generateDeterministicAdvice } from "@/lib/ai/fallback-advisor";
import { saveChatMessage } from "@/lib/data/chat";
import { CHAT_RATE_LIMIT, enforceRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export interface ChatRequestBody {
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  conversationId?: string;
  context?: GroundingContext;
  stream?: boolean;
}

/**
 * Helper to produce a deterministic fallback SSE stream.
 */
function createFallbackStreamResponse(
  adviceText: string,
  conversationId: string,
  extraHeaders: Record<string, string> = {}
): Response {
  const { cleanContent, actions } = parseStructuredActions(adviceText);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const tokens = adviceText.match(/\S+|\s+/g) || [adviceText];
        for (const token of tokens) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ token, done: false })}\n\n`)
          );
        }

        await saveChatMessage({
          conversation_id: conversationId,
          role: "assistant",
          content: cleanContent,
          actions,
        }).catch((e) => console.warn("Failed to persist fallback chat message:", e));

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              token: "",
              done: true,
              cleanContent,
              actions,
              provider: "deterministic-fallback",
              model: "offline-rule-engine",
            })}\n\n`
          )
        );
      } catch (streamErr) {
        console.error("Error during fallback SSE streaming:", streamErr);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Fallback-Mode": "true",
      ...extraHeaders,
    },
  });
}

/**
 * Helper to produce a deterministic fallback JSON response.
 */
async function createFallbackJsonResponse(
  adviceText: string,
  conversationId: string,
  extraHeaders: Record<string, string> = {}
): Promise<NextResponse> {
  const { cleanContent, actions } = parseStructuredActions(adviceText);

  await saveChatMessage({
    conversation_id: conversationId,
    role: "assistant",
    content: cleanContent,
    actions,
  }).catch((e) => console.warn("Failed to persist fallback chat message:", e));

  return NextResponse.json(
    {
      reply: cleanContent,
      rawReply: adviceText,
      actions,
      provider: "deterministic-fallback",
      model: "offline-rule-engine",
    },
    {
      status: 200,
      headers: {
        "X-Fallback-Mode": "true",
        ...extraHeaders,
      },
    }
  );
}

export async function POST(req: NextRequest) {
  const rateLimit = await enforceRateLimit(req, CHAT_RATE_LIMIT);
  if (!rateLimit.success) return rateLimit.response;

  const rateLimitHeaders: Record<string, string> = {
    "X-RateLimit-Remaining": String(rateLimit.limit.remaining),
    "X-RateLimit-Reset": String(Math.ceil(rateLimit.limit.resetMs / 1000)),
  };

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

    // Save latest user message to Supabase / store
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    const userQuery = lastUserMsg?.content || "";

    if (lastUserMsg) {
      await saveChatMessage({
        conversation_id: conversationId,
        role: "user",
        content: userQuery,
      }).catch((e) => console.warn("Failed to persist user chat message:", e));
    }

    // Check for DeepSeek / AI API key
    const config = getProviderConfig();
    const apiKey = process.env.DEEPSEEK_API_KEY || config.apiKey;

    // Deterministic fallback if API key is missing
    if (!apiKey) {
      const fallbackAdvice = generateDeterministicAdvice(userQuery, groundingContext);
      if (!wantsStream) {
        return await createFallbackJsonResponse(fallbackAdvice, conversationId, rateLimitHeaders);
      }
      return createFallbackStreamResponse(fallbackAdvice, conversationId, rateLimitHeaders);
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
      // Non-streaming Mode with upstream error / rate-limit fallback
      try {
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
          console.warn(`Upstream AI provider error (Status: ${res.status}). Triggering deterministic fallback.`);
          const fallbackAdvice = generateDeterministicAdvice(userQuery, groundingContext);
          return await createFallbackJsonResponse(fallbackAdvice, conversationId, rateLimitHeaders);
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

        return NextResponse.json(
          {
            reply: cleanContent,
            rawReply,
            actions,
            provider: config.provider,
            model,
          },
          {
            headers: rateLimitHeaders,
          }
        );
      } catch (upstreamErr) {
        console.warn("Upstream fetch exception. Triggering deterministic fallback.", upstreamErr);
        const fallbackAdvice = generateDeterministicAdvice(userQuery, groundingContext);
        return await createFallbackJsonResponse(fallbackAdvice, conversationId, rateLimitHeaders);
      }
    }

    // Streaming SSE Mode with upstream error / rate-limit fallback
    let upstreamRes: Response;
    try {
      upstreamRes = await fetch(endpointUrl, {
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
    } catch (networkErr) {
      console.warn("Network error reaching upstream AI provider. Triggering deterministic fallback.", networkErr);
      const fallbackAdvice = generateDeterministicAdvice(userQuery, groundingContext);
      return createFallbackStreamResponse(fallbackAdvice, conversationId, rateLimitHeaders);
    }

    if (!upstreamRes.ok || !upstreamRes.body) {
      console.warn(
        `Upstream AI returned status ${upstreamRes.status}. Triggering deterministic fallback.`
      );
      const fallbackAdvice = generateDeterministicAdvice(userQuery, groundingContext);
      return createFallbackStreamResponse(fallbackAdvice, conversationId, rateLimitHeaders);
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
        ...rateLimitHeaders,
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
