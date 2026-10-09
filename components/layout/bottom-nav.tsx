"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Settings,
  Bell,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/context/app-context";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    matchPrefix: "/dashboard",
  },
  {
    label: "Preferences",
    href: "/preferences",
    icon: Settings,
    matchPrefix: "/preferences",
  },
  {
    label: "Notifications",
    href: "/notifications",
    icon: Bell,
    matchPrefix: "/notifications",
  },
  {
    label: "Help",
    href: "/help",
    icon: HelpCircle,
    matchPrefix: "/help",
  },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const { unreadCount } = useApp();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around px-2 py-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.matchPrefix !== "/dashboard" &&
              pathname.startsWith(item.matchPrefix)) ||
            (item.matchPrefix === "/dashboard" &&
              (pathname === "/dashboard" ||
                pathname.startsWith("/trips") ||
                pathname.startsWith("/recovery")));

          const showBadge =
            item.matchPrefix === "/notifications" && unreadCount > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-2 px-3 min-w-[64px] touch-target rounded-lg transition-colors duration-150",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="relative">
                <Icon className="w-5 h-5" aria-hidden="true" />
                {showBadge && (
                  <span
                    className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold text-white bg-disruption rounded-full"
                    aria-label={`${unreadCount} unread notifications`}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </span>
              <span className="text-[11px] font-medium leading-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Safe area inset for notched phones */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
