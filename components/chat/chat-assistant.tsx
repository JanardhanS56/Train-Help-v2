"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, X, Send, Sparkles } from "lucide-react";
import { useApp, useAppDispatch } from "@/context/app-context";
import { cannedResponses } from "@/mock/data";
import { ChatQuickActions } from "@/components/chat/chat-quick-actions";

export function ChatAssistant() {
  const router = useRouter();
  const { state, alternatives, rankedAlternatives } = useApp();
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Compute opening line dynamically based on real state
  const totalAlts = alternatives.length || 5;
  const matchingCount = useMemo(() => {
    return rankedAlternatives.filter(
      (a) =>
        a.fare <= state.preferences.maxBudget &&
        (state.preferences.maxChangesPreference === "any" || a.changes <= 1)
    ).length;
  }, [rankedAlternatives, state.preferences]);

  const dynamicWelcome = useMemo(() => {
    return `Your train was cancelled. I found ${totalAlts} alternatives; ${matchingCount} fit your preferences.`;
  }, [totalAlts, matchingCount]);

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [open, state.chatMessages]);

  function handleQuickAction(action: string) {
    const timestamp = new Date();

    if (action === "show-alternatives") {
      dispatch({
        type: "ADD_CHAT_MESSAGE",
        message: { id: `msg-${Date.now()}`, role: "user", content: "Show alternatives", timestamp },
      });
      dispatch({ type: "SET_RECOVERY_STAGE", stage: "alternatives" });
      router.push("/recovery/trip-4");
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
      }, 300);
    } else if (action === "show-fastest") {
      dispatch({
        type: "ADD_CHAT_MESSAGE",
        message: { id: `msg-${Date.now()}`, role: "user", content: "Show fastest option", timestamp },
      });
      dispatch({ type: "SET_FILTERS", filters: { sortBy: "duration", sortDirection: "asc" } });
      dispatch({ type: "SET_RECOVERY_STAGE", stage: "alternatives" });
      router.push("/recovery/trip-4");
      setTimeout(() => {
        dispatch({
          type: "ADD_CHAT_MESSAGE",
          message: {
            id: `msg-resp-${Date.now()}`,
            role: "assistant",
            content: "Sorted alternatives by travel duration. Fastest Superfast and Rajdhani express trains are listed first.",
            timestamp: new Date(),
          },
        });
      }, 300);
    } else if (action === "change-budget") {
      dispatch({
        type: "ADD_CHAT_MESSAGE",
        message: { id: `msg-${Date.now()}`, role: "user", content: "Change budget", timestamp },
      });
      router.push("/preferences");
      setTimeout(() => {
        dispatch({
          type: "ADD_CHAT_MESSAGE",
          message: {
            id: `msg-resp-${Date.now()}`,
            role: "assistant",
            content: "Opened your preferences. Adjust your maximum fare budget to recalculate alternative rankings live.",
            timestamp: new Date(),
          },
        });
      }, 300);
    } else if (action === "help-decide") {
      dispatch({
        type: "ADD_CHAT_MESSAGE",
        message: { id: `msg-${Date.now()}`, role: "user", content: "Help me decide", timestamp },
      });
      setTimeout(() => {
        dispatch({
          type: "ADD_CHAT_MESSAGE",
          message: {
            id: `msg-resp-${Date.now()}`,
            role: "assistant",
            content: "If arriving before your Delhi morning meeting is vital, choose Bengaluru Rajdhani Express (22691) — arrives at 05:30 (+2 days) with confirmed 3A berths. If you prefer premium speed, Karnataka SF Express (12627) via NZM is ₹2,850.",
            timestamp: new Date(),
          },
        });
      }, 300);
    }
  }

  function handleSend(text: string) {
    if (!text.trim()) return;
    const userText = text.trim();
    setInput("");

    const timestamp = new Date();
    dispatch({
      type: "ADD_CHAT_MESSAGE",
      message: { id: `user-${Date.now()}`, role: "user", content: userText, timestamp },
    });

    const lower = userText.toLowerCase();
    const match = cannedResponses.find(
      (r) =>
        lower.includes(r.trigger) ||
        (r.trigger === "what-happened" && (lower.includes("what") || lower.includes("happen"))) ||
        (r.trigger === "refund-info" && lower.includes("refund"))
    );

    const reply = match
      ? match.response
      : "I'm monitoring your Bengaluru to Delhi rail disruption. You can view all recovery options, sort by arrival or fare, or adjust class preferences.";

    setTimeout(() => {
      dispatch({
        type: "ADD_CHAT_MESSAGE",
        message: { id: `asst-${Date.now()}`, role: "assistant", content: reply, timestamp: new Date() },
      });
    }, 350);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="fixed bottom-20 md:bottom-6 right-6 z-40 p-3.5 rounded-full bg-primary text-primary-foreground shadow-card hover:bg-primary-hover transition-transform hover:scale-105 touch-target flex items-center justify-center gap-2"
        aria-label="Open recovery assistant"
        aria-expanded={open}
      >
        <MessageSquare className="w-5 h-5" />
        <span className="hidden sm:inline text-xs font-semibold pr-1">Assistant</span>
      </button>

      {open && (
        <aside
          role="dialog"
          aria-label="Recovery assistant chat"
          className="fixed inset-x-0 bottom-0 md:inset-y-0 md:left-auto md:right-0 md:w-96 z-50 bg-surface border-t md:border-t-0 md:border-l border-border shadow-card flex flex-col max-h-[85vh] md:max-h-full rounded-t-2xl md:rounded-none animate-in slide-in-from-bottom md:slide-in-from-right duration-200"
        >
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">Travel Assistant</h2>
                <p className="text-[11px] text-muted-foreground">Train disruption recovery helper</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-md hover:bg-background text-muted-foreground hover:text-foreground transition-colors touch-target"
              aria-label="Close assistant"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <ChatQuickActions onAction={handleQuickAction} />

          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-foreground space-y-1">
              <p className="font-semibold text-primary">Live Disruption Update</p>
              <p className="leading-relaxed">{dynamicWelcome}</p>
            </div>

            {state.chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`p-3 rounded-xl max-w-[85%] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-background border border-border text-foreground rounded-bl-none"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="p-3 border-t border-border bg-surface flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about trains, berths, or refunds..."
              className="flex-1 text-xs rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:ring-1 focus:ring-primary outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary-hover transition-colors touch-target"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </aside>
      )}
    </>
  );
}
