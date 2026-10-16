"use client";

import { useState, useRef, useEffect, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Send,
  Trash2,
  Bot,
  Loader2,
  Sparkles,
  AlertCircle,
  ArrowRight,
  Sliders,
  PlayCircle,
} from "lucide-react";
import { useApp, useAppDispatch } from "@/context/app-context";
import { ChatQuickActions } from "@/components/chat/chat-quick-actions";
import { useChatAssistantState } from "@/components/chat/chat-controller";
import { ChatMarkdown } from "@/components/chat/chat-markdown";
import { useAntiSpam } from "@/lib/hooks/use-anti-spam";
import type { ChatMessage } from "@/lib/types";

export function ChatAssistant() {
  const router = useRouter();
  const { state, alternatives, rankedAlternatives, selectedTrip } = useApp();
  const dispatch = useAppDispatch();
  const { isOpen: open, closeChat, toggleChat } = useChatAssistantState();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeProviderBadge, setActiveProviderBadge] = useState<string>("DEEPSEEK · deepseek-chat");
  const [, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isLocked: isSpamLocked, executeProtectedAction } = useAntiSpam({ cooldownMs: 750 });

  const totalAlts = alternatives.length || 5;
  const matchingCount = useMemo(() => {
    return rankedAlternatives.filter(
      (a) =>
        a.fare <= state.preferences.maxBudget &&
        (state.preferences.maxChangesPreference === "any" || a.changes <= 1)
    ).length;
  }, [rankedAlternatives, state.preferences]);

  const dynamicWelcome = useMemo(() => {
    return `Your train was cancelled. I found ${totalAlts} alternatives; ${matchingCount} fit your travel preferences. How can I help you today?`;
  }, [totalAlts, matchingCount]);

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [open, state.chatMessages, isLoading, streamingText]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        closeChat();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, closeChat]);

  async function sendMessageToAssistant(userText: string) {
    if (!userText.trim() || isLoading) return;

    setErrorMessage(null);
    setStreamingText("");
    const timestamp = new Date();
    const userMessageId = `user-${Date.now()}`;

    // Add user message to state
    dispatch({
      type: "ADD_CHAT_MESSAGE",
      message: { id: userMessageId, role: "user", content: userText, timestamp },
    });

    setIsLoading(true);

    // Prepare message history
    const historyPayload = state.chatMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));
    historyPayload.push({ role: "user", content: userText });

    const conversationId = `conv-${state.selectedTripId || "default"}`;
    const groundingContext = {
      activeTrip: selectedTrip,
      topAlternatives: rankedAlternatives.slice(0, 3),
      preferences: state.preferences,
      currentTime: new Date().toISOString(),
    };

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historyPayload,
          conversationId,
          context: groundingContext,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errText = errorData.error || `Server returned ${response.status}`;
        setErrorMessage(errText);
        dispatch({
          type: "ADD_CHAT_MESSAGE",
          message: {
            id: `err-${Date.now()}`,
            role: "assistant",
            content: `⚠️ **AI Service Notice**: ${errText}`,
            timestamp: new Date(),
          },
        });
        setIsLoading(false);
        return;
      }

      // Read SSE stream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No readable stream response received.");
      }

      const decoder = new TextDecoder();
      let accumulated = "";
      let finalActions: ChatMessage["actions"] = [];
      let finalModel = "deepseek-chat";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data:")) continue;

          const jsonStr = trimmed.slice(5).trim();
          try {
            const data = JSON.parse(jsonStr);
            if (data.token) {
              accumulated += data.token;
              setStreamingText(accumulated);
            }
            if (data.done) {
              if (data.actions) finalActions = data.actions;
              if (data.model) finalModel = data.model;
              if (data.cleanContent) accumulated = data.cleanContent;
            }
          } catch {
            // ignore non-json
          }
        }
      }

      setActiveProviderBadge(`DEEPSEEK · ${finalModel}`);
      setStreamingText("");

      // Add complete assistant message with actions to state
      dispatch({
        type: "ADD_CHAT_MESSAGE",
        message: {
          id: `asst-${Date.now()}`,
          role: "assistant",
          content: accumulated || "No response received.",
          timestamp: new Date(),
          actions: finalActions,
        },
      });
    } catch (err: unknown) {
      const errorStr = (err as Error)?.message || "Network error communicating with AI service.";
      setErrorMessage(errorStr);
      dispatch({
        type: "ADD_CHAT_MESSAGE",
        message: {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: `⚠️ **Connection Error**: ${errorStr}. Ensure local connectivity and verify your environment configuration.`,
          timestamp: new Date(),
        },
      });
    } finally {
      setIsLoading(false);
      setStreamingText("");
    }
  }

  function handleExecuteStructuredAction(action: {
    type: string;
    payload: Record<string, string>;
    label: string;
  }) {
    if (action.type === "SELECT_ALTERNATIVE") {
      const altId = action.payload.alternativeId;
      if (altId) {
        dispatch({ type: "SELECT_ALTERNATIVE", alternativeId: altId });
        dispatch({ type: "SET_RECOVERY_STAGE", stage: "itinerary" });
        const tripId = state.selectedTripId || "trip-4";
        startTransition(() => {
          router.push(`/recovery/${tripId}`);
        });
      }
    } else if (action.type === "ADJUST_PREFERENCE") {
      const key = action.payload.preferenceKey;
      const val = action.payload.preferenceValue;
      if (key && val) {
        const parsedVal: unknown = key === "maxBudget" ? parseInt(val, 10) || 3500 : val;
        dispatch({
          type: "UPDATE_PREFERENCES",
          preferences: { [key]: parsedVal },
        });
      }
    } else if (action.type === "TRIGGER_SIMULATION") {
      startTransition(() => {
        router.push("/simulation");
      });
    }
  }

  function handleQuickAction(actionId: string) {
    if (actionId === "show-alternatives") {
      sendMessageToAssistant("Show all available verified alternative trains for my cancelled journey.");
      return;
    }
    if (actionId === "show-fastest") {
      sendMessageToAssistant("What is the fastest alternative train available?");
      return;
    }
    if (actionId === "change-budget") {
      sendMessageToAssistant("How can I adjust my budget or class preferences for more options?");
      return;
    }
  }

  function handleClearChat() {
    dispatch({ type: "CLEAR_CHAT_MESSAGES" });
    setErrorMessage(null);
    setStreamingText("");
  }

  return (
    <>
      {/* Floating launcher button */}
      {!open && (
        <button
          type="button"
          onClick={() => toggleChat()}
          className="fixed bottom-6 right-6 z-40 h-12 px-4 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary-hover flex items-center gap-2 transition-all hover:scale-105 focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Open AI Assistant"
        >
          <Bot className="w-5 h-5" />
          <span className="text-xs font-semibold">Rail Assistant</span>
        </button>
      )}

      {/* Slide-over chat drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="TravelRescue AI Train Assistant"
            initial={{ opacity: 0, x: 28, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 28, y: 10, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="fixed inset-x-0 bottom-0 md:inset-y-0 md:left-auto md:right-0 md:w-[420px] z-50 bg-surface border-t md:border-t-0 md:border-l border-border flex flex-col max-h-[90vh] md:max-h-full rounded-t-2xl md:rounded-none shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3.5 border-b border-hairline bg-surface/80 backdrop-blur-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-foreground">TravelRescue AI</h2>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted font-mono text-muted-foreground border border-border">
                      {activeProviderBadge}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">DeepSeek V3 Grounded Rail Engine</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleClearChat}
                  className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  title="Clear chat history"
                  aria-label="Clear chat history"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => closeChat()}
                  className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  aria-label="Close assistant"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Reply Suggestion Chips */}
            <ChatQuickActions onAction={handleQuickAction} />

            {/* Error Banner if any */}
            {errorMessage && (
              <div className="px-3 py-2 bg-destructive/10 border-b border-destructive/20 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{errorMessage}</span>
              </div>
            )}

            {/* Message History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
              {/* System welcome bubble */}
              <div className="p-3 rounded-xl bg-neutral-tint text-foreground text-xs leading-relaxed border border-border/50">
                <div className="flex items-center gap-1.5 font-medium text-primary mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Live Rail Intelligence (DeepSeek V3)</span>
                </div>
                <p>{dynamicWelcome}</p>
              </div>

              {state.chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`p-3 rounded-xl max-w-[88%] leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground font-normal rounded-br-xs shadow-sm"
                        : "bg-neutral-tint text-foreground rounded-bl-xs border border-border/60 shadow-xs"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="space-y-2">
                        <ChatMarkdown content={msg.content} />

                        {/* Interactive Structured Actions */}
                        {msg.actions && msg.actions.length > 0 && (
                          <div className="pt-2 border-t border-border/50 flex flex-col gap-1.5">
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                              Suggested Actions
                            </span>
                            {msg.actions.map((act, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => handleExecuteStructuredAction(act)}
                                className="w-full text-left px-2.5 py-1.5 rounded-md bg-background border border-primary/30 hover:border-primary text-primary text-xs font-medium flex items-center justify-between transition-colors shadow-2xs"
                              >
                                <span className="flex items-center gap-1.5">
                                  {act.type === "SELECT_ALTERNATIVE" && <ArrowRight className="w-3 h-3" />}
                                  {act.type === "ADJUST_PREFERENCE" && <Sliders className="w-3 h-3" />}
                                  {act.type === "TRIGGER_SIMULATION" && <PlayCircle className="w-3 h-3" />}
                                  {act.label}
                                </span>
                                <ArrowRight className="w-3 h-3 opacity-60" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 px-1 font-mono">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}

              {/* Real-time Streaming message bubble */}
              {isLoading && streamingText && (
                <div className="flex flex-col items-start">
                  <div className="p-3 rounded-xl max-w-[88%] leading-relaxed bg-neutral-tint text-foreground rounded-bl-xs border border-border/60 shadow-xs">
                    <ChatMarkdown content={streamingText} />
                  </div>
                </div>
              )}

              {/* Thinking indicator before first token */}
              {isLoading && !streamingText && (
                <div className="flex items-center gap-2 text-muted-foreground text-xs p-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  <span>DeepSeek V3 is reviewing live railway telemetry...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Form with Anti-Spam protection */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const text = input.trim();
                if (text && !isLoading && !isSpamLocked) {
                  executeProtectedAction(() => {
                    setInput("");
                    return sendMessageToAssistant(text);
                  });
                }
              }}
              className="p-3 border-t border-hairline bg-surface/80 backdrop-blur-sm flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about alternatives, tatkal, refunds..."
                disabled={isLoading}
                className="flex-1 h-9 px-3 text-xs rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading || isSpamLocked}
                className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary-hover disabled:opacity-50 transition-colors"
                aria-label="Send message"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
