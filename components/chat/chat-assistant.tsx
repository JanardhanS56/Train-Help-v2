"use client";

import { useState, useRef, useEffect, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Trash2, Bot, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { useApp, useAppDispatch } from "@/context/app-context";
import { ChatQuickActions } from "@/components/chat/chat-quick-actions";
import { useChatAssistantState } from "@/components/chat/chat-controller";
import { ChatMarkdown } from "@/components/chat/chat-markdown";
import { useAntiSpam } from "@/lib/hooks/use-anti-spam";

export function ChatAssistant() {
  const router = useRouter();
  const { state, alternatives, rankedAlternatives } = useApp();
  const dispatch = useAppDispatch();
  const { isOpen: open, closeChat, toggleChat } = useChatAssistantState();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeProviderBadge, setActiveProviderBadge] = useState<string>("TravelRescue AI");
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
  }, [open, state.chatMessages, isLoading]);

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

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: historyPayload }),
      });

      const data = await response.json();

      if (!response.ok || data.isError) {
        const errorText = data.error || `Server responded with status ${response.status}`;
        setErrorMessage(errorText);

        // Fallback message so user is not blocked
        dispatch({
          type: "ADD_CHAT_MESSAGE",
          message: {
            id: `err-${Date.now()}`,
            role: "assistant",
            content: `⚠️ **Notice**: ${errorText}\n\n*Falling back to local railway guide mode. You can continue asking questions about trains, tatkal, or recovery.*`,
            timestamp: new Date(),
          },
        });
      } else {
        if (data.provider) {
          setActiveProviderBadge(
            data.isMock
              ? "Offline Demo Guide"
              : `${data.provider.toUpperCase()} · ${data.model.split("/").pop()}`
          );
        }

        dispatch({
          type: "ADD_CHAT_MESSAGE",
          message: {
            id: `asst-${Date.now()}`,
            role: "assistant",
            content: data.reply || "No response received.",
            timestamp: new Date(),
          },
        });
      }
    } catch (err: unknown) {
      const errorStr = (err as Error)?.message || "Network error communicating with AI service.";
      setErrorMessage(errorStr);
      dispatch({
        type: "ADD_CHAT_MESSAGE",
        message: {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: `⚠️ **Connection Error**: ${errorStr}. Check your local connection or .env settings.`,
          timestamp: new Date(),
        },
      });
    } finally {
      setIsLoading(false);
    }
  }

  function handleQuickAction(actionId: string, promptText?: string) {
    if (actionId === "show-alternatives") {
      dispatch({
        type: "ADD_CHAT_MESSAGE",
        message: { id: `msg-${Date.now()}`, role: "user", content: "Show alternatives", timestamp: new Date() },
      });
      dispatch({ type: "SET_RECOVERY_STAGE", stage: "alternatives" });
      startTransition(() => {
        router.push("/recovery/trip-4");
      });
      setTimeout(() => {
        dispatch({
          type: "ADD_CHAT_MESSAGE",
          message: {
            id: `msg-resp-${Date.now()}`,
            role: "assistant",
            content: "Navigated to recovery options. All verified Indian Railways train alternatives are listed with live class availability.",
            timestamp: new Date(),
          },
        });
      }, 250);
      return;
    }

    if (actionId === "show-fastest") {
      dispatch({
        type: "ADD_CHAT_MESSAGE",
        message: { id: `msg-${Date.now()}`, role: "user", content: "Show fastest option", timestamp: new Date() },
      });
      dispatch({ type: "SET_FILTERS", filters: { sortBy: "duration", sortDirection: "asc" } });
      dispatch({ type: "SET_RECOVERY_STAGE", stage: "alternatives" });
      startTransition(() => {
        router.push("/recovery/trip-4");
      });
      setTimeout(() => {
        dispatch({
          type: "ADD_CHAT_MESSAGE",
          message: {
            id: `msg-resp-${Date.now()}`,
            role: "assistant",
            content: "Sorted alternatives by travel duration. Rajdhani and Superfast express trains are listed first.",
            timestamp: new Date(),
          },
        });
      }, 250);
      return;
    }

    if (actionId === "change-budget") {
      dispatch({
        type: "ADD_CHAT_MESSAGE",
        message: { id: `msg-${Date.now()}`, role: "user", content: "Change budget", timestamp: new Date() },
      });
      startTransition(() => {
        router.push("/preferences");
      });
      setTimeout(() => {
        dispatch({
          type: "ADD_CHAT_MESSAGE",
          message: {
            id: `msg-resp-${Date.now()}`,
            role: "assistant",
            content: "Opened preferences. Adjust your maximum fare budget to recalculate alternative rankings live.",
            timestamp: new Date(),
          },
        });
      }, 250);
      return;
    }

    if (actionId === "help-decide") {
      sendMessageToAssistant("Help me decide between the available alternative trains from Bengaluru to Delhi");
      return;
    }

    if (promptText) {
      sendMessageToAssistant(promptText);
    }
  }

  function handleClearChat() {
    dispatch({ type: "CLEAR_CHAT_MESSAGES" });
    setErrorMessage(null);
  }

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <button
        type="button"
        onClick={(e) => toggleChat(e.currentTarget)}
        className="fixed bottom-20 md:bottom-6 right-6 z-40 h-11 px-4 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:bg-primary-hover transition-all flex items-center justify-center gap-2 select-none border border-primary/20"
        aria-label="Open AI Train Assistant"
        aria-expanded={open}
      >
        <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
        <span className="text-xs font-semibold tracking-wide">AI Assistant</span>
      </button>

      {/* Slide-over dockable drawer with smooth spring animations */}
      <AnimatePresence>
        {open && (
          <motion.aside
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
                  <p className="text-[11px] text-muted-foreground">Train schedules, booking & policies</p>
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
                  onClick={closeChat}
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
                  <span>Live Rail Intelligence</span>
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
                      <ChatMarkdown content={msg.content} />
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 px-1 font-mono">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}

              {/* Thinking / Streaming indicator */}
              {isLoading && (
                <div className="flex items-center gap-2 text-muted-foreground text-xs p-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  <span>Assistant is checking train schedules...</span>
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
              className="p-3 border-t border-hairline bg-surface flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about trains, Tatkal rules, refunds..."
                disabled={isLoading}
                className="flex-1 text-xs rounded-lg border border-border bg-background px-3.5 py-2.5 text-foreground focus:ring-1 focus:ring-primary outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading || isSpamLocked}
                className="h-9 px-3.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary-hover transition-colors flex items-center justify-center shrink-0 shadow-xs active:scale-95"
                aria-label="Send message"
              >
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </button>
            </form>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
