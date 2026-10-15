"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Train,
  ShieldAlert,
  MoreHorizontal,
  Bot,
  Bell,
  Settings,
  HelpCircle,
  X,
  Sun,
  Moon,
  LogOut,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp, useAppDispatch } from "@/context/app-context";
import { useAuth } from "@/context/auth-context";
import { useChatAssistantState } from "@/components/chat/chat-controller";

export function BottomNav() {
  const pathname = usePathname();
  const { state, unreadCount } = useApp();
  const { user, signOut } = useAuth();
  const dispatch = useAppDispatch();
  const { openChat } = useChatAssistantState();

  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const isMoreActive =
    pathname.startsWith("/notifications") ||
    pathname.startsWith("/preferences") ||
    pathname.startsWith("/help");

  const closeMore = useCallback(() => {
    setIsMoreOpen(false);
    setTimeout(() => {
      moreButtonRef.current?.focus();
    }, 50);
  }, []);

  // Handle Escape key and focus trap
  useEffect(() => {
    if (!isMoreOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeMore();
        return;
      }

      if (e.key === "Tab") {
        const focusable = sheetRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    // Focus first focusable item in sheet
    setTimeout(() => {
      const firstFocusable = sheetRef.current?.querySelector<HTMLElement>(
        'button, [href]'
      );
      firstFocusable?.focus();
    }, 50);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMoreOpen, closeMore]);

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

  function handleOpenAssistant() {
    closeMore();
    setTimeout(() => {
      openChat(moreButtonRef.current);
    }, 100);
  }

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border"
        role="navigation"
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-around px-2 py-1">
          {/* 1. Dashboard */}
          {(() => {
            const isActive = pathname === "/dashboard";
            return (
              <Link
                href="/dashboard"
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2 px-3 min-w-[64px] min-h-[44px] transition-colors duration-150 touch-target",
                  isActive
                    ? "text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <LayoutDashboard className="w-5 h-5 stroke-[1.5]" aria-hidden="true" />
                <span className="text-[11px] leading-tight">Dashboard</span>
              </Link>
            );
          })()}

          {/* 2. My Trips */}
          {(() => {
            const isActive = pathname.startsWith("/trips");
            return (
              <Link
                href="/trips"
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2 px-3 min-w-[64px] min-h-[44px] transition-colors duration-150 touch-target",
                  isActive
                    ? "text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Train className="w-5 h-5 stroke-[1.5]" aria-hidden="true" />
                <span className="text-[11px] leading-tight">My Trips</span>
              </Link>
            );
          })()}

          {/* 3. Recovery */}
          {(() => {
            const isActive = pathname.startsWith("/recovery");
            return (
              <Link
                href="/recovery"
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2 px-3 min-w-[64px] min-h-[44px] transition-colors duration-150 touch-target",
                  isActive
                    ? "text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <ShieldAlert className="w-5 h-5 stroke-[1.5]" aria-hidden="true" />
                <span className="text-[11px] leading-tight">Recovery</span>
              </Link>
            );
          })()}

          {/* 4. More */}
          <button
            ref={moreButtonRef}
            type="button"
            onClick={() => setIsMoreOpen((prev) => !prev)}
            aria-expanded={isMoreOpen}
            aria-haspopup="dialog"
            aria-label="More navigation options"
            className={cn(
              "relative flex flex-col items-center justify-center gap-1 py-2 px-3 min-w-[64px] min-h-[44px] transition-colors duration-150 touch-target",
              isMoreActive || isMoreOpen
                ? "text-primary font-medium"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="relative">
              <MoreHorizontal className="w-5 h-5 stroke-[1.5]" aria-hidden="true" />
              {unreadCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-destructive ring-2 ring-surface"
                  aria-label={`${unreadCount} unread notifications`}
                />
              )}
            </span>
            <span className="text-[11px] leading-tight">More</span>
          </button>
        </div>

        {/* Safe area inset for notched phones */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>

      {/* ── More Bottom Sheet ── */}
      {isMoreOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex flex-col justify-end animate-in fade-in-50 duration-150"
          onClick={closeMore}
        >
          <div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label="More options"
            onClick={(e) => e.stopPropagation()}
            className="bg-surface border-t border-border rounded-t-2xl p-4 space-y-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-2xl animate-in slide-in-from-bottom duration-200"
          >
            {/* Sheet Header */}
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">More Options</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted touch-target"
                  aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {isDark ? (
                    <Sun className="w-4 h-4 text-warning stroke-[1.5]" />
                  ) : (
                    <Moon className="w-4 h-4 stroke-[1.5]" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={closeMore}
                  className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted touch-target"
                  aria-label="Close menu"
                >
                  <X className="w-4 h-4 stroke-[1.5]" />
                </button>
              </div>
            </div>

            {/* Sheet Links & Actions */}
            <div className="grid grid-cols-1 gap-1 text-sm">
              {/* 0. Live Rail Simulation */}
              <Link
                href="/simulation"
                onClick={closeMore}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg transition-colors min-h-[44px] touch-target",
                  pathname.startsWith("/simulation")
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground hover:bg-muted"
                )}
                aria-current={pathname.startsWith("/simulation") ? "page" : undefined}
              >
                <Activity className="w-5 h-5 text-primary stroke-[1.5]" aria-hidden="true" />
                <span className="flex-1 font-medium">Live Simulation</span>
                <span className="text-[11px] font-semibold text-primary px-1.5 py-0.5 rounded bg-primary/10">
                  New
                </span>
              </Link>

              {/* 1. AI Assistant */}
              <button
                type="button"
                onClick={handleOpenAssistant}
                className="flex items-center gap-3 px-3 py-3 rounded-lg text-foreground hover:bg-muted transition-colors min-h-[44px] text-left touch-target"
              >
                <Bot className="w-5 h-5 text-primary stroke-[1.5]" aria-hidden="true" />
                <span className="flex-1 font-medium">AI Assistant</span>
                <span className="text-[11px] text-muted-foreground">Open chat</span>
              </button>

              {/* 2. Notifications */}
              <Link
                href="/notifications"
                onClick={closeMore}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg transition-colors min-h-[44px] touch-target",
                  pathname.startsWith("/notifications")
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground hover:bg-muted"
                )}
                aria-current={pathname.startsWith("/notifications") ? "page" : undefined}
              >
                <Bell className="w-5 h-5 stroke-[1.5]" aria-hidden="true" />
                <span className="flex-1 font-medium">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {unreadCount}
                    <span className="sr-only"> unread notifications</span>
                  </span>
                )}
              </Link>

              {/* 3. Preferences */}
              <Link
                href="/preferences"
                onClick={closeMore}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg transition-colors min-h-[44px] touch-target",
                  pathname.startsWith("/preferences")
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground hover:bg-muted"
                )}
                aria-current={pathname.startsWith("/preferences") ? "page" : undefined}
              >
                <Settings className="w-5 h-5 stroke-[1.5]" aria-hidden="true" />
                <span className="flex-1 font-medium">Preferences</span>
              </Link>

              {/* 4. Help */}
              <Link
                href="/help"
                onClick={closeMore}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg transition-colors min-h-[44px] touch-target",
                  pathname.startsWith("/help")
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground hover:bg-muted"
                )}
                aria-current={pathname.startsWith("/help") ? "page" : undefined}
              >
                <HelpCircle className="w-5 h-5 stroke-[1.5]" aria-hidden="true" />
                <span className="flex-1 font-medium">Help</span>
              </Link>

              {/* 5. User Profile & Sign Out */}
              <div className="pt-2 mt-1 border-t border-hairline flex items-center justify-between gap-3 px-2">
                <div className="min-w-0 flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-semibold text-xs shrink-0">
                    {user?.name ? user.name.slice(0, 2).toUpperCase() : "PA"}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-foreground truncate">
                      {user?.name || "Passenger"}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate font-mono">
                      {user?.email || "passenger@railmail.in"}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  id="btn-mobile-signout"
                  onClick={() => {
                    closeMore();
                    signOut();
                  }}
                  className="px-3 py-1.5 rounded-lg border border-disruption/30 text-disruption bg-disruption-tint/40 hover:bg-disruption-tint text-xs font-medium flex items-center gap-1.5 transition-colors touch-target"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
