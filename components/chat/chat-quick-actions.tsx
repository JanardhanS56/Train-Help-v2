"use client";

import { Train, Zap, Sliders, HelpCircle } from "lucide-react";

interface ChatQuickActionsProps {
  onAction: (action: string) => void;
}

export function ChatQuickActions({ onAction }: ChatQuickActionsProps) {
  const actions = [
    { id: "show-alternatives", label: "Show alternatives", icon: Train, iconColor: "text-primary" },
    { id: "show-fastest", label: "Show fastest option", icon: Zap, iconColor: "text-warning" },
    { id: "change-budget", label: "Change budget", icon: Sliders, iconColor: "text-primary" },
    { id: "help-decide", label: "Help me decide", icon: HelpCircle, iconColor: "text-primary" },
  ];

  return (
    <div className="p-2.5 bg-background border-b border-border flex flex-wrap gap-1.5 text-xs">
      {actions.map(({ id, label, icon: Icon, iconColor }) => (
        <button
          key={id}
          type="button"
          onClick={() => onAction(id)}
          className="px-2.5 py-1 rounded-full border border-border bg-surface text-foreground font-medium hover:border-primary transition-colors text-[11px] flex items-center gap-1 touch-target"
        >
          <Icon className={`w-3 h-3 ${iconColor}`} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
