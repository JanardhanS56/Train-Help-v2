"use client";

import Link from "next/link";
import { Bell, Moon, Sun } from "lucide-react";
import { useApp, useAppDispatch } from "@/context/app-context";
import { DemoStateMenu } from "@/components/trips/demo-state-menu";
import { useHydrated } from "@/hooks/use-hydrated";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function DashboardHeader() {
  const { state, unreadCount } = useApp();
  const dispatch = useAppDispatch();
  const isHydrated = useHydrated();

  const greeting = isHydrated ? getGreeting() : "Welcome";
  const isDark =
    state.theme === "dark" ||
    (state.theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  function toggleTheme() {
    dispatch({
      type: "SET_THEME",
      theme: isDark ? "light" : "dark",
    });
  }

  return (
    <header className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-6 border-b border-border/60 mb-10">
      <div>
        <h1 className="text-[32px] font-display text-foreground tracking-tight leading-none">
          {greeting}, Vikram
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Here is the status of your upcoming journeys.
        </p>
      </div>

      <div className="flex items-center gap-1.5 self-start sm:self-auto">
        {/* Discreet Demo Menu */}
        <DemoStateMenu />

        {/* Dark/Light mode toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded transition-colors"
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun className="w-4 h-4 text-warning stroke-[1.5]" /> : <Moon className="w-4 h-4 stroke-[1.5]" />}
        </button>

        {/* Notifications Bell with unread badge */}
        <Link
          href="/notifications"
          className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded transition-colors"
          aria-label={`Notifications (${unreadCount} unread)`}
        >
          <Bell className="w-4 h-4 stroke-[1.5]" />
          {unreadCount > 0 && (
            <span
              className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary"
              aria-hidden="true"
            />
          )}
        </Link>

        {/* User Avatar */}
        <div
          className="w-7 h-7 rounded-full bg-muted border border-border text-foreground font-mono text-[11px] font-medium flex items-center justify-center ml-1"
          aria-label="Vikram Patel profile"
          title="Vikram Patel"
        >
          VP
        </div>
      </div>
    </header>
  );
}
