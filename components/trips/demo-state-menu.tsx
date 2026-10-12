"use client";

import { useState, useRef, useEffect } from "react";
import { RotateCcw, AlertCircle, Loader2, Inbox, Check, SlidersHorizontal } from "lucide-react";
import { useApp, useAppDispatch } from "@/context/app-context";
import type { DemoState } from "@/lib/types";

export function DemoStateMenu() {
  const { state } = useApp();
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const current = state.demoState;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const states: { id: DemoState; label: string; icon: typeof Check }[] = [
    { id: "normal", label: "Normal View", icon: Check },
    { id: "loading", label: "Loading State", icon: Loader2 },
    { id: "empty", label: "Empty State", icon: Inbox },
    { id: "error", label: "Error State", icon: AlertCircle },
  ];

  function handleResetDemo() {
    dispatch({ type: "RESET_DEMO" });
    setOpen(false);
  }

  function handleToggleNoResults() {
    // Sets filters so no alternatives match
    dispatch({
      type: "SET_FILTERS",
      filters: { maxFare: 500, classFilter: "EC" },
    });
    setOpen(false);
  }

  return (
    <div className="relative inline-block demo-menu-container" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded transition-colors"
        aria-label="Demo controls and sample states"
        aria-expanded={open}
      >
        <span>Demo</span>
        <span className="text-[10px] font-mono text-muted-foreground">▾</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-1.5 w-52 rounded-lg bg-surface border border-border z-50 py-1 text-xs animate-in fade-in-50 duration-150"
        >
          <div className="px-3 py-1.5 border-b border-border flex items-center justify-between">
            <span className="font-semibold text-muted-foreground">Demo Controls</span>
            <span className="text-[10px] text-primary font-semibold uppercase tracking-wider bg-primary/10 px-1.5 py-0.5 rounded">
              Sample data
            </span>
          </div>

          <div className="py-1">
            {states.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="menuitem"
                onClick={() => {
                  dispatch({ type: "SET_DEMO_STATE", demoState: id });
                  setOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-background transition-colors text-foreground"
              >
                <span className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                  {label}
                </span>
                {current === id && <Check className="w-3.5 h-3.5 text-primary" />}
              </button>
            ))}

            <button
              type="button"
              role="menuitem"
              onClick={handleToggleNoResults}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-foreground hover:bg-background transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Simulate No Results</span>
            </button>
          </div>

          <div className="pt-1 border-t border-border">
            <button
              type="button"
              role="menuitem"
              onClick={handleResetDemo}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-disruption hover:bg-disruption/10 font-semibold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo (All Data)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
