"use client";

import { Train, Zap, Sliders, HelpCircle, Clock, ShieldCheck } from "lucide-react";

interface ChatQuickActionsProps {
  onAction: (action: string, promptText?: string) => void;
}

export function ChatQuickActions({ onAction }: ChatQuickActionsProps) {
  const actions = [
    { id: "find-mumbai", label: "Find trains to Mumbai", icon: Train, prompt: "Find trains to Mumbai" },
    { id: "live-status", label: "Check live status", icon: Clock, prompt: "Check live status of my trains" },
    { id: "tatkal-rules", label: "Tatkal rules", icon: Zap, prompt: "What are the Tatkal booking rules and timings?" },
    { id: "claim-refund", label: "Claim refund", icon: ShieldCheck, prompt: "How do I claim a refund for a cancelled train?" },
    { id: "show-alternatives", label: "Show alternatives", icon: Train },
    { id: "show-fastest", label: "Fastest option", icon: Zap },
    { id: "change-budget", label: "Change budget", icon: Sliders },
    { id: "help-decide", label: "Help me decide", icon: HelpCircle },
  ];

  return (
    <div className="p-2.5 bg-surface border-b border-hairline flex flex-wrap gap-1.5 text-xs max-h-28 overflow-y-auto">
      {actions.map(({ id, label, icon: Icon, prompt }) => (
        <button
          key={id}
          type="button"
          onClick={() => onAction(id, prompt)}
          className="px-2.5 py-1 rounded-full border border-border bg-surface text-foreground font-normal hover:border-primary/60 hover:bg-background transition-colors text-xs flex items-center gap-1.5 shrink-0"
        >
          <Icon className="w-3 h-3 text-muted-foreground stroke-[1.5]" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
