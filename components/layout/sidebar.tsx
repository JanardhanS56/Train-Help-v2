"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Settings,
  Bell,
  HelpCircle,
  Shield,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useApp, useAppDispatch } from "@/context/app-context";
import { APP_NAME } from "@/lib/constants";

const ICON_MAP = {
  "layout-dashboard": LayoutDashboard,
  settings: Settings,
  bell: Bell,
  "help-circle": HelpCircle,
} as const;

interface SidebarNavItem {
  label: string;
  href: string;
  iconName: keyof typeof ICON_MAP;
  matchPrefix: string;
  badge?: number;
}

export function Sidebar() {
  const pathname = usePathname();
  const { state, unreadCount } = useApp();
  const dispatch = useAppDispatch();

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

  const navItems: SidebarNavItem[] = [
    {
      label: "Dashboard",
      href: "/dashboard",
      iconName: "layout-dashboard",
      matchPrefix: "/dashboard",
    },
    {
      label: "Preferences",
      href: "/preferences",
      iconName: "settings",
      matchPrefix: "/preferences",
    },
    {
      label: "Notifications",
      href: "/notifications",
      iconName: "bell",
      matchPrefix: "/notifications",
      badge: unreadCount,
    },
    {
      label: "Help",
      href: "/help",
      iconName: "help-circle",
      matchPrefix: "/help",
    },
  ];

  return (
    <aside
      className="hidden md:flex md:flex-col md:w-60 bg-sidebar border-r border-sidebar-border h-full select-none"
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo / Brand */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-sidebar-border/60">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 hover:opacity-85 transition-opacity"
        >
          <div className="flex items-center justify-center w-6 h-6 rounded bg-primary text-primary-foreground">
            <Shield className="w-3.5 h-3.5 stroke-[1.5]" aria-hidden="true" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground font-sans">
            {APP_NAME}
          </span>
        </Link>

        {/* Theme toggle in sidebar header */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors touch-target"
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun className="w-4 h-4 text-warning stroke-[1.5]" /> : <Moon className="w-4 h-4 stroke-[1.5]" />}
        </button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-3">
        <nav className="flex flex-col">
          {navItems.map((item) => {
            const Icon = ICON_MAP[item.iconName];
            const isActive =
              pathname === item.href ||
              (item.matchPrefix !== "/dashboard" &&
                pathname.startsWith(item.matchPrefix)) ||
              (item.matchPrefix === "/dashboard" &&
                (pathname === "/dashboard" ||
                  pathname.startsWith("/trips") ||
                  pathname.startsWith("/recovery")));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-5 py-2.5 text-sm transition-colors duration-150 border-l-2",
                  isActive
                    ? "border-primary bg-sidebar-accent text-primary font-medium"
                    : "border-transparent text-foreground hover:bg-sidebar-accent/50 text-[#1F2328] dark:text-[#ECEDEE]"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="w-5 h-5 stroke-[1.5] shrink-0" aria-hidden="true" />
                <span className="flex-1">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="text-[11px] font-mono font-medium px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-sidebar-border/60 space-y-1.5 text-xs text-muted-foreground">
        <p className="leading-normal">
          Indian Railways Disruption Recovery
        </p>
        <div className="flex items-center gap-1.5 pt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-success" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Active System
          </span>
        </div>
      </div>
    </aside>
  );
}
