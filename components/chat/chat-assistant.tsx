"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, X, Send } from "lucide-react";
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

  const totalAlts = alternatives.length || 5;
  const matchingCount = useMemo(() => {
    return rankedAlternatives.filter(
      (a) =>
        a.fare <= state.preferences.maxBudget &&
        (state.preferences.maxChangesPreference === "any" || a.changes <= 1)
    ).length;
  }, [rankedAlternatives, state.preferences]);

  const dynamicWelcome = useMemo(() => {
    return `Your train was cancelled. I found ${totalAlts} alternatives; ${matchingCount} fit your travel preferences.`;
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
      }, 250);
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
            content: "Sorted alternatives by travel duration. Rajdhani and Superfast express trains are listed first.",
            timestamp: new Date(),
          },
        });
      }, 250);
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
      }, 250);
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
            content: "If reaching your Delhi meeting on time is vital, choose Bengaluru Rajdhani Express (22691) — arrives at 05:30 (+2 days) with confirmed 3A berths. If you prefer lower fare, Karnataka SF Express (12627) is ₹2,850.",
            timestamp: new Date(),
          },
        });
      }, 250);
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
      : "I'm tracking your Bengaluru to Delhi disruption. You can view replacement trains, sort by arrival or fare, or adjust class preferences.";

    setTimeout(() => {
      dispatch({
        type: "ADD_CHAT_MESSAGE",
        message: { id: `asst-${Date.now()}`, role: "assistant", content: reply, timestamp: new Date() },
      });
    }, 250);
  }

  return (
    <>
      {/* Floating Button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="fixed bottom-20 md:bottom-6 right-6 z-40 h-10 px-4 rounded-[8px] bg-primary text-primary-foreground hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 select-none"
        aria-label="Open recovery assistant"
        aria-expanded={open}
      >
        <MessageSquare className="w-4 h-4 stroke-[1.5]" />
        <span className="text-xs font-medium">Assistant</span>
      </button>

      {/* Slide-over panel: White surface, 1px border */}
      {open && (
        <aside
          role="dialog"
          aria-label="Recovery assistant chat"
          className="fixed inset-x-0 bottom-0 md:inset-y-0 md:left-auto md:right-0 md:w-96 z-50 bg-surface border-t md:border-t-0 md:border-l border-border flex flex-col max-h-[85vh] md:max-h-full rounded-t-xl md:rounded-none animate-in slide-in-from-bottom md:slide-in-from-right duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-hairline">
            <div>
              <h2 className="text-sm font-medium text-foreground">Disruption Assistant</h2>
              <p className="text-[11px] text-muted-foreground">Indian Railways journey support</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close assistant"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Actions as outline chips */}
          <ChatQuickActions onAction={handleQuickAction} />

          {/* Messages: Assistant messages in subtle neutral bubble, user in navy */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-neutral-tint text-foreground text-xs leading-relaxed">
              <span className="font-medium text-primary block mb-0.5">Disruption Update</span>
              <span>{dynamicWelcome}</span>
            </div>

            {state.chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`p-3 rounded-lg max-w-[85%] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground font-normal"
                      : "bg-neutral-tint text-foreground"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="p-3 border-t border-hairline bg-surface flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about trains, berths, or refunds..."
              className="flex-1 text-xs rounded border border-border bg-background px-3 py-2 text-foreground focus:ring-1 focus:ring-primary outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="h-8 px-3 rounded bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary-hover transition-colors flex items-center justify-center"
              aria-label="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </aside>
      )}
    </>
  );
}
