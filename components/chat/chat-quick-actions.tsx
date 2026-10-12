"use client";

import { Train, Zap, Sliders, HelpCircle } from "lucide-react";

interface ChatQuickActionsProps {
  onAction: (action: string) => void;
}

export function ChatQuickActions({ onAction }: ChatQuickActionsProps) {
  const actions = [
    { id: "show-alternatives", label: "Show alternatives", icon: Train },
    { id: "show-fastest", label: "Fastest option", icon: Zap },
    { id: "change-budget", label: "Change budget", icon: Sliders },
    { id: "help-decide", label: "Help me decide", icon: HelpCircle },
  ];

  return (
    <div className="p-3 bg-surface border-b border-hairline flex flex-wrap gap-1.5 text-xs">
      {actions.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onAction(id)}
          className="px-2.5 py-1 rounded-full border border-border bg-surface text-foreground font-normal hover:border-primary/60 hover:bg-background transition-colors text-xs flex items-center gap-1.5"
        >
          <Icon className="w-3 h-3 text-muted-foreground stroke-[1.5]" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
