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
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border mb-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          {greeting}, Vikram
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Here is the status of your upcoming journeys.
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Dark/Light mode toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-lg border border-border bg-surface text-muted-foreground hover:text-foreground hover:bg-background transition-colors touch-target flex items-center justify-center shadow-card"
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun className="w-4 h-4 text-warning" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Discreet Demo Menu */}
        <DemoStateMenu />

        {/* Notifications Bell with unread badge */}
        <Link
          href="/notifications"
          className="relative p-2 rounded-lg border border-border bg-surface text-muted-foreground hover:text-foreground hover:bg-background transition-colors touch-target flex items-center justify-center shadow-card"
          aria-label={`Notifications (${unreadCount} unread)`}
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-4 px-1 text-[10px] font-bold text-white bg-disruption rounded-full"
              aria-hidden="true"
            >
              {unreadCount}
            </span>
          )}
        </Link>

        {/* User Avatar */}
        <div
          className="w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-xs flex items-center justify-center ring-2 ring-border"
          aria-label="Vikram Patel profile"
          title="Vikram Patel"
        >
          VP
        </div>
      </div>
    </header>
  );
}
