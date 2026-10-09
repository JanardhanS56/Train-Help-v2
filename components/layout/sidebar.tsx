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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
      className="hidden md:flex md:flex-col md:w-64 bg-surface border-r border-border h-full"
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo / Brand */}
      <div className="flex items-center justify-between px-6 py-5">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 hover:opacity-85 transition-opacity"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
            <Shield className="w-4 h-4" aria-hidden="true" />
          </div>
          <span className="text-base font-bold text-foreground tracking-tight">
            {APP_NAME}
          </span>
        </Link>

        {/* Theme toggle in sidebar header */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-1.5 rounded-md hover:bg-background text-muted-foreground hover:text-foreground transition-colors touch-target"
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun className="w-4 h-4 text-warning" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      <Separator className="mx-4" />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
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
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 touch-target",
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-background hover:text-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span className="flex-1">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <Badge
                    variant="destructive"
                    className="radius-badge text-xs px-2 py-0.5 min-w-[20px] text-center"
                  >
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <Separator className="mx-4" />
      <div className="px-6 py-4 space-y-2">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Something went wrong?
          <br />
          We&rsquo;ve got this.
        </p>
        <div className="flex items-center gap-1.5 pt-1">
          <span className="w-2 h-2 rounded-full bg-success" />
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Sample data
          </span>
        </div>
      </div>
    </aside>
  );
}
