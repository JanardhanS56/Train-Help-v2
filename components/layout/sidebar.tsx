"use client";

import { useState, useEffect, useRef, useId, useCallback, useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Train,
  ShieldAlert,
  Bot,
  Bell,
  Settings,
  HelpCircle,
  ChevronDown,
  Shield,
  Sun,
  Moon,
  LogOut,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useApp, useAppDispatch } from "@/context/app-context";
import { useAuth } from "@/context/auth-context";
import { useTripGroups } from "@/lib/tripGroups";
import { useChatAssistantState } from "@/components/chat/chat-controller";
import { APP_NAME } from "@/lib/constants";
import { DatabaseConnectionStatus } from "@/components/status/database-connection-status";

const STORAGE_EXPANDED_KEY = "tr_nav_expanded_v1";

interface ExpandedState {
  trips?: boolean;
  recovery?: boolean;
}

function subscribeExpanded(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("tr_nav_expanded_changed", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("tr_nav_expanded_changed", callback);
  };
}

function getExpandedSnapshot(): string {
  try {
    return localStorage.getItem(STORAGE_EXPANDED_KEY) || "{}";
  } catch {
    return "{}";
  }
}

function getExpandedServerSnapshot(): string {
  return "{}";
}

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { state, unreadCount } = useApp();
  const dispatch = useAppDispatch();
  const tripGroups = useTripGroups();
  const { isOpen: isAssistantOpen, toggleChat } = useChatAssistantState();
  const { user, signOut } = useAuth();

  const assistantBtnRef = useRef<HTMLButtonElement>(null);
  const tripsSubnavId = useId();
  const recoverySubnavId = useId();

  // Tablet popover state for icon-only rail (768-1023px)
  const [tabletOpenGroup, setTabletOpenGroup] = useState<"trips" | "recovery" | null>(null);
  const tabletPopoverRef = useRef<HTMLDivElement>(null);

  // Synchronized expanded choices via useSyncExternalStore (SSR and hydration safe)
  const expandedSnapshot = useSyncExternalStore(
    subscribeExpanded,
    getExpandedSnapshot,
    getExpandedServerSnapshot
  );

  const manualExpanded: ExpandedState = useMemo(() => {
    try {
      return JSON.parse(expandedSnapshot);
    } catch {
      return {};
    }
  }, [expandedSnapshot]);

  // Close tablet popover on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && tabletOpenGroup) {
        setTabletOpenGroup(null);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tabletOpenGroup]);

  // Close tablet popover on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        tabletPopoverRef.current &&
        !tabletPopoverRef.current.contains(e.target as Node)
      ) {
        setTabletOpenGroup(null);
      }
    }
    if (tabletOpenGroup) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [tabletOpenGroup]);

  // Helper to persist only manual open/closed choices
  const setTripsManual = useCallback((open: boolean) => {
    try {
      const next = { ...manualExpanded, trips: open };
      localStorage.setItem(STORAGE_EXPANDED_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event("tr_nav_expanded_changed"));
    } catch {
      // Storage unavailable
    }
  }, [manualExpanded]);

  const setRecoveryManual = useCallback((open: boolean) => {
    try {
      const next = { ...manualExpanded, recovery: open };
      localStorage.setItem(STORAGE_EXPANDED_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event("tr_nav_expanded_changed"));
    } catch {
      // Storage unavailable
    }
  }, [manualExpanded]);

  // Auto-expand rule: current route wins over saved preference
  const isTripsRoute = pathname.startsWith("/trips");
  const isRecoveryRoute = pathname.startsWith("/recovery");

  const isTripsExpanded = isTripsRoute || Boolean(manualExpanded.trips);
  const isRecoveryExpanded = isRecoveryRoute || Boolean(manualExpanded.recovery);

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

  // Active sub-item resolution
  const currentTripsStatus = searchParams.get("status") || "all";
  const currentRecoveryTab = searchParams.get("tab") || "active";

  const renderBadge = (count: number, isDisruptionTint: boolean = false, srText?: string) => {
    if (count <= 0) return null;
    return (
      <span
        className={cn(
          "text-[11px] font-mono font-medium px-1.5 py-0.2 rounded tabular-nums shrink-0",
          isDisruptionTint
            ? "bg-disruption-tint text-disruption border border-disruption/30 font-semibold"
            : "bg-muted text-muted-foreground"
        )}
      >
        {count > 99 ? "99+" : count}
        {srText && <span className="sr-only"> ({srText})</span>}
      </span>
    );
  };

  return (
    <aside
      className="hidden md:flex md:flex-col md:w-16 lg:w-60 bg-sidebar border-r border-sidebar-border h-full select-none sticky top-0 shrink-0"
      role="navigation"
      aria-label="Main navigation"
    >
      {/* ── Brand Header ── */}
      <div className="flex items-center justify-between px-3 lg:px-5 py-4 border-b border-sidebar-border/60">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 hover:opacity-85 transition-opacity"
          aria-label={`${APP_NAME} Dashboard`}
        >
          <div className="flex items-center justify-center w-7 h-7 rounded bg-primary text-primary-foreground shrink-0 shadow-sm">
            <Shield className="w-4 h-4 stroke-[1.5]" aria-hidden="true" />
          </div>
          <span className="hidden lg:inline text-sm font-semibold tracking-tight text-foreground font-sans">
            {APP_NAME}
          </span>
        </Link>

        {/* Theme toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="hidden lg:flex p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors touch-target"
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-warning stroke-[1.5]" />
          ) : (
            <Moon className="w-4 h-4 stroke-[1.5]" />
          )}
        </button>
      </div>

      {/* ── Scrollable Nav ── */}
      <ScrollArea className="flex-1 py-2">
        <nav className="flex flex-col gap-0.5">
          {/* 1. Dashboard */}
          {(() => {
            const isActive = pathname === "/dashboard";
            return (
              <div className="relative group">
                <Link
                  href="/dashboard"
                  className={cn(
                    "flex items-center justify-center lg:justify-start gap-3 px-3 lg:px-5 py-2.5 text-sm transition-colors duration-150 border-l-2",
                    isActive
                      ? "border-primary bg-sidebar-accent text-primary font-medium"
                      : "border-transparent text-foreground hover:bg-sidebar-accent/50 text-[#1F2328] dark:text-[#ECEDEE]"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <LayoutDashboard className="w-5 h-5 stroke-[1.5] shrink-0" aria-hidden="true" />
                  <span className="hidden lg:inline flex-1">Dashboard</span>
                </Link>
                {/* Tablet Tooltip */}
                <div
                  role="tooltip"
                  className="lg:hidden absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-foreground text-background text-xs rounded shadow-md pointer-events-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-50 whitespace-nowrap"
                >
                  Dashboard
                </div>
              </div>
            );
          })()}

          {/* 2. My Trips (Expandable) */}
          {(() => {
            const isActive = pathname === "/trips";
            return (
              <div className="relative group">
                <div
                  className={cn(
                    "flex items-center justify-between px-3 lg:px-5 py-1 text-sm border-l-2 transition-colors duration-150",
                    isTripsRoute
                      ? "border-primary bg-sidebar-accent text-primary font-medium"
                      : "border-transparent text-foreground hover:bg-sidebar-accent/50"
                  )}
                >
                  <Link
                    href="/trips"
                    className="flex items-center justify-center lg:justify-start gap-3 flex-1 py-1.5 outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
                    aria-current={isActive && !searchParams.get("status") ? "page" : undefined}
                  >
                    <Train className="w-5 h-5 stroke-[1.5] shrink-0" aria-hidden="true" />
                    <span className="hidden lg:inline flex-1 text-left">My Trips</span>
                  </Link>

                  {/* Tablet trigger: toggles tablet popover */}
                  <button
                    type="button"
                    onClick={() =>
                      setTabletOpenGroup((curr) => (curr === "trips" ? null : "trips"))
                    }
                    className="lg:hidden p-1 text-muted-foreground hover:text-foreground"
                    aria-label="Toggle My Trips options"
                    aria-expanded={tabletOpenGroup === "trips"}
                  >
                    <ChevronDown className="w-3.5 h-3.5 stroke-[1.5]" />
                  </button>

                  {/* Desktop Chevron button */}
                  <div className="hidden lg:flex items-center gap-1.5">
                    {renderBadge(
                      tripGroups.counts.attention,
                      tripGroups.hasUnrecoveredCancelled,
                      `${tripGroups.counts.attention} attention trips`
                    )}
                    <button
                      type="button"
                      onClick={() => setTripsManual(!isTripsExpanded)}
                      aria-expanded={isTripsExpanded}
                      aria-controls={tripsSubnavId}
                      aria-label={isTripsExpanded ? "Collapse My Trips" : "Expand My Trips"}
                      className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-sidebar-border/40 transition-transform duration-150 motion-reduce:transition-none"
                    >
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 stroke-[1.5] transition-transform duration-150 motion-reduce:transition-none",
                          isTripsExpanded && "rotate-180"
                        )}
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </div>

                {/* Tablet Tooltip */}
                <div
                  role="tooltip"
                  className="lg:hidden absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-foreground text-background text-xs rounded shadow-md pointer-events-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-50 whitespace-nowrap"
                >
                  My Trips
                </div>

                {/* Desktop Sub-list: 14px muted text, 32px indent, 1px guide line */}
                {isTripsExpanded && (
                  <ul
                    id={tripsSubnavId}
                    role="list"
                    aria-label="My Trips sections"
                    className="hidden lg:block pl-8 border-l border-sidebar-border/80 ml-6 my-1 space-y-0.5 text-sm transition-[max-height,opacity] duration-200 ease-out motion-reduce:transition-none"
                  >
                    {[
                      { key: "all", label: "All trips", count: tripGroups.counts.all },
                      { key: "upcoming", label: "Upcoming", count: tripGroups.counts.upcoming },
                      {
                        key: "attention",
                        label: "Needs attention",
                        count: tripGroups.counts.attention,
                        disruptionTint: tripGroups.hasUnrecoveredCancelled,
                      },
                      { key: "recovered", label: "Recovered", count: tripGroups.counts.recovered },
                      { key: "past", label: "Past", count: tripGroups.counts.past },
                    ].map((sub) => {
                      const isChildActive =
                        pathname === "/trips" && currentTripsStatus === sub.key;

                      return (
                        <li key={sub.key}>
                          <Link
                            href={`/trips?status=${sub.key}`}
                            className={cn(
                              "flex items-center justify-between pr-4 py-1.5 text-xs transition-colors border-l-2 -ml-[1px]",
                              isChildActive
                                ? "border-primary text-primary font-medium"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                            )}
                            aria-current={isChildActive ? "page" : undefined}
                          >
                            <span>{sub.label}</span>
                            {renderBadge(sub.count, sub.disruptionTint, `${sub.count} ${sub.label}`)}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })()}

          {/* 3. Recovery Centre (Expandable) */}
          {(() => {
            const isActive = pathname === "/recovery";
            return (
              <div className="relative group">
                <div
                  className={cn(
                    "flex items-center justify-between px-3 lg:px-5 py-1 text-sm border-l-2 transition-colors duration-150",
                    isRecoveryRoute
                      ? "border-primary bg-sidebar-accent text-primary font-medium"
                      : "border-transparent text-foreground hover:bg-sidebar-accent/50"
                  )}
                >
                  <Link
                    href="/recovery"
                    className="flex items-center justify-center lg:justify-start gap-3 flex-1 py-1.5 outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
                    aria-current={isActive && !searchParams.get("tab") ? "page" : undefined}
                  >
                    <ShieldAlert className="w-5 h-5 stroke-[1.5] shrink-0" aria-hidden="true" />
                    <span className="hidden lg:inline flex-1 text-left">Recovery Centre</span>
                  </Link>

                  {/* Tablet trigger: toggles tablet popover */}
                  <button
                    type="button"
                    onClick={() =>
                      setTabletOpenGroup((curr) => (curr === "recovery" ? null : "recovery"))
                    }
                    className="lg:hidden p-1 text-muted-foreground hover:text-foreground"
                    aria-label="Toggle Recovery Centre options"
                    aria-expanded={tabletOpenGroup === "recovery"}
                  >
                    <ChevronDown className="w-3.5 h-3.5 stroke-[1.5]" />
                  </button>

                  {/* Desktop Chevron button */}
                  <div className="hidden lg:flex items-center gap-1.5">
                    {renderBadge(
                      tripGroups.counts.activeRecovery,
                      tripGroups.hasUnrecoveredCancelled,
                      `${tripGroups.counts.activeRecovery} active recovery`
                    )}
                    <button
                      type="button"
                      onClick={() => setRecoveryManual(!isRecoveryExpanded)}
                      aria-expanded={isRecoveryExpanded}
                      aria-controls={recoverySubnavId}
                      aria-label={
                        isRecoveryExpanded
                          ? "Collapse Recovery Centre"
                          : "Expand Recovery Centre"
                      }
                      className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-sidebar-border/40 transition-transform duration-150 motion-reduce:transition-none"
                    >
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 stroke-[1.5] transition-transform duration-150 motion-reduce:transition-none",
                          isRecoveryExpanded && "rotate-180"
                        )}
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </div>

                {/* Tablet Tooltip */}
                <div
                  role="tooltip"
                  className="lg:hidden absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-foreground text-background text-xs rounded shadow-md pointer-events-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-50 whitespace-nowrap"
                >
                  Recovery Centre
                </div>

                {/* Desktop Sub-list */}
                {isRecoveryExpanded && (
                  <ul
                    id={recoverySubnavId}
                    role="list"
                    aria-label="Recovery Centre sections"
                    className="hidden lg:block pl-8 border-l border-sidebar-border/80 ml-6 my-1 space-y-0.5 text-sm transition-[max-height,opacity] duration-200 ease-out motion-reduce:transition-none"
                  >
                    {[
                      {
                        key: "active",
                        label: "Active recovery",
                        count: tripGroups.counts.activeRecovery,
                        disruptionTint: tripGroups.hasUnrecoveredCancelled,
                      },
                      { key: "refunds", label: "Refunds", count: tripGroups.counts.refunds },
                      { key: "history", label: "History", count: tripGroups.counts.history },
                    ].map((sub) => {
                      const isChildActive =
                        pathname === "/recovery" && currentRecoveryTab === sub.key;

                      return (
                        <li key={sub.key}>
                          <Link
                            href={`/recovery?tab=${sub.key}`}
                            className={cn(
                              "flex items-center justify-between pr-4 py-1.5 text-xs transition-colors border-l-2 -ml-[1px]",
                              isChildActive
                                ? "border-primary text-primary font-medium"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                            )}
                            aria-current={isChildActive ? "page" : undefined}
                          >
                            <span>{sub.label}</span>
                            {renderBadge(sub.count, sub.disruptionTint, `${sub.count} ${sub.label}`)}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })()}

          {/* 3.5 Simulation */}
          {(() => {
            const isActive = pathname.startsWith("/simulation");
            return (
              <div className="relative group">
                <Link
                  href="/simulation"
                  className={cn(
                    "flex items-center justify-center lg:justify-start gap-3 px-3 lg:px-5 py-2.5 text-sm transition-colors duration-150 border-l-2",
                    isActive
                      ? "border-primary bg-sidebar-accent text-primary font-medium"
                      : "border-transparent text-foreground hover:bg-sidebar-accent/50 text-[#1F2328] dark:text-[#ECEDEE]"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Activity className="w-5 h-5 stroke-[1.5] shrink-0 text-primary" aria-hidden="true" />
                  <span className="hidden lg:inline flex-1">Simulation</span>
                  <span className="hidden lg:inline-flex items-center text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                    Live
                  </span>
                </Link>
                {/* Tablet Tooltip */}
                <div
                  role="tooltip"
                  className="lg:hidden absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-foreground text-background text-xs rounded shadow-md pointer-events-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-50 whitespace-nowrap"
                >
                  Simulation
                </div>
              </div>
            );
          })()}

          {/* 4. AI Assistant (Opens existing chat panel, no route) */}
          <div className="relative group">
            <button
              ref={assistantBtnRef}
              type="button"
              onClick={() => toggleChat(assistantBtnRef.current)}
              aria-pressed={isAssistantOpen}
              className={cn(
                "w-full flex items-center justify-center lg:justify-start gap-3 px-3 lg:px-5 py-2.5 text-sm transition-colors duration-150 border-l-2 text-left",
                isAssistantOpen
                  ? "border-primary bg-sidebar-accent text-primary font-medium"
                  : "border-transparent text-foreground hover:bg-sidebar-accent/50 text-[#1F2328] dark:text-[#ECEDEE]"
              )}
            >
              <Bot className="w-5 h-5 stroke-[1.5] shrink-0" aria-hidden="true" />
              <span className="hidden lg:inline flex-1">AI Assistant</span>
            </button>
            {/* Tablet Tooltip */}
            <div
              role="tooltip"
              className="lg:hidden absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-foreground text-background text-xs rounded shadow-md pointer-events-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-50 whitespace-nowrap"
            >
              AI Assistant
            </div>
          </div>

          {/* 5. Notifications */}
          {(() => {
            const isActive = pathname.startsWith("/notifications");
            return (
              <div className="relative group">
                <Link
                  href="/notifications"
                  className={cn(
                    "flex items-center justify-center lg:justify-start gap-3 px-3 lg:px-5 py-2.5 text-sm transition-colors duration-150 border-l-2",
                    isActive
                      ? "border-primary bg-sidebar-accent text-primary font-medium"
                      : "border-transparent text-foreground hover:bg-sidebar-accent/50 text-[#1F2328] dark:text-[#ECEDEE]"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Bell className="w-5 h-5 stroke-[1.5] shrink-0" aria-hidden="true" />
                  <span className="hidden lg:inline flex-1">Notifications</span>
                  <span className="hidden lg:inline">
                    {renderBadge(unreadCount, false, `${unreadCount} unread notifications`)}
                  </span>
                </Link>
                {/* Tablet Tooltip */}
                <div
                  role="tooltip"
                  className="lg:hidden absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-foreground text-background text-xs rounded shadow-md pointer-events-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-50 whitespace-nowrap"
                >
                  Notifications {unreadCount > 0 ? `(${unreadCount})` : ""}
                </div>
              </div>
            );
          })()}

          {/* ── Hairline Divider ── */}
          <div className="my-2 border-t border-hairline mx-3 lg:mx-5" role="separator" />

          {/* 6. Preferences */}
          {(() => {
            const isActive = pathname.startsWith("/preferences");
            return (
              <div className="relative group">
                <Link
                  href="/preferences"
                  className={cn(
                    "flex items-center justify-center lg:justify-start gap-3 px-3 lg:px-5 py-2.5 text-sm transition-colors duration-150 border-l-2",
                    isActive
                      ? "border-primary bg-sidebar-accent text-primary font-medium"
                      : "border-transparent text-foreground hover:bg-sidebar-accent/50 text-[#1F2328] dark:text-[#ECEDEE]"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Settings className="w-5 h-5 stroke-[1.5] shrink-0" aria-hidden="true" />
                  <span className="hidden lg:inline flex-1">Preferences</span>
                </Link>
                {/* Tablet Tooltip */}
                <div
                  role="tooltip"
                  className="lg:hidden absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-foreground text-background text-xs rounded shadow-md pointer-events-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-50 whitespace-nowrap"
                >
                  Preferences
                </div>
              </div>
            );
          })()}

          {/* 7. Help */}
          {(() => {
            const isActive = pathname.startsWith("/help");
            return (
              <div className="relative group">
                <Link
                  href="/help"
                  className={cn(
                    "flex items-center justify-center lg:justify-start gap-3 px-3 lg:px-5 py-2.5 text-sm transition-colors duration-150 border-l-2",
                    isActive
                      ? "border-primary bg-sidebar-accent text-primary font-medium"
                      : "border-transparent text-foreground hover:bg-sidebar-accent/50 text-[#1F2328] dark:text-[#ECEDEE]"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <HelpCircle className="w-5 h-5 stroke-[1.5] shrink-0" aria-hidden="true" />
                  <span className="hidden lg:inline flex-1">Help</span>
                </Link>
                {/* Tablet Tooltip */}
                <div
                  role="tooltip"
                  className="lg:hidden absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-foreground text-background text-xs rounded shadow-md pointer-events-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-50 whitespace-nowrap"
                >
                  Help
                </div>
              </div>
            );
          })()}
        </nav>
      </ScrollArea>

      {/* ── Tablet Popover for Rail (768-1023px) ── */}
      {tabletOpenGroup && (
        <div
          ref={tabletPopoverRef}
          role="dialog"
          aria-label={tabletOpenGroup === "trips" ? "My Trips submenu" : "Recovery Centre submenu"}
          className="lg:hidden fixed left-16 top-24 z-50 w-56 rounded-lg border border-border bg-surface p-2 shadow-xl animate-in fade-in-50 zoom-in-95 duration-150"
        >
          <div className="text-xs font-semibold px-2 py-1 border-b border-hairline mb-1 text-foreground">
            {tabletOpenGroup === "trips" ? "My Trips" : "Recovery Centre"}
          </div>
          {tabletOpenGroup === "trips" ? (
            <ul className="space-y-0.5 text-xs">
              {[
                { key: "all", label: "All trips", count: tripGroups.counts.all },
                { key: "upcoming", label: "Upcoming", count: tripGroups.counts.upcoming },
                {
                  key: "attention",
                  label: "Needs attention",
                  count: tripGroups.counts.attention,
                  disruptionTint: tripGroups.hasUnrecoveredCancelled,
                },
                { key: "recovered", label: "Recovered", count: tripGroups.counts.recovered },
                { key: "past", label: "Past", count: tripGroups.counts.past },
              ].map((sub) => (
                <li key={sub.key}>
                  <Link
                    href={`/trips?status=${sub.key}`}
                    onClick={() => setTabletOpenGroup(null)}
                    className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted text-foreground"
                  >
                    <span>{sub.label}</span>
                    {renderBadge(sub.count, sub.disruptionTint)}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="space-y-0.5 text-xs">
              {[
                {
                  key: "active",
                  label: "Active recovery",
                  count: tripGroups.counts.activeRecovery,
                  disruptionTint: tripGroups.hasUnrecoveredCancelled,
                },
                { key: "refunds", label: "Refunds", count: tripGroups.counts.refunds },
                { key: "history", label: "History", count: tripGroups.counts.history },
              ].map((sub) => (
                <li key={sub.key}>
                  <Link
                    href={`/recovery?tab=${sub.key}`}
                    onClick={() => setTabletOpenGroup(null)}
                    className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted text-foreground"
                  >
                    <span>{sub.label}</span>
                    {renderBadge(sub.count, sub.disruptionTint)}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ── User Profile & Sign Out ── */}
      <div className="border-t border-sidebar-border/60 p-3 lg:p-4 bg-surface/50">
        {/* Desktop User Row */}
        <div className="hidden lg:flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
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
            id="btn-sidebar-signout"
            onClick={signOut}
            title="Sign out"
            aria-label="Sign out"
            className="p-1.5 rounded-md text-muted-foreground hover:text-disruption hover:bg-disruption-tint/50 transition-colors shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        {/* Tablet Rail User Icon */}
        <div className="lg:hidden flex justify-center relative group">
          <button
            type="button"
            id="btn-tablet-signout"
            onClick={signOut}
            aria-label="Sign out"
            className="h-9 w-9 rounded-md flex items-center justify-center text-muted-foreground hover:text-disruption hover:bg-disruption-tint/50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
          <div
            role="tooltip"
            className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-foreground text-background text-xs rounded shadow-md pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap"
          >
            Sign out ({user?.name || "Passenger"})
          </div>
        </div>
      </div>

      {/* ── Footer & DB Status ── */}
      <div className="hidden lg:block px-5 py-3 border-t border-sidebar-border/60 space-y-2 text-xs text-muted-foreground">
        <DatabaseConnectionStatus />
        <div className="space-y-0.5">
          <p className="leading-normal">Train disruption recovery</p>
          <p className="text-[11px] font-mono text-muted-foreground/75">Railway Passenger System</p>
        </div>
      </div>
    </aside>
  );
}
