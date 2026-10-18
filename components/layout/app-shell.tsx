"use client";

import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { GlobalLoadingIndicator } from "@/components/layout/global-loading-indicator";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-dvh overflow-hidden app-sunset-theme" data-app-theme="sunset">
      <GlobalLoadingIndicator />
      {/* Accessible skip to main content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-md focus:text-xs focus:font-medium outline-none focus:ring-2 focus:ring-ring"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content area */}
      <main
        className="flex-1 overflow-y-auto pb-20 md:pb-0"
        id="main-content"
        role="main"
        tabIndex={-1}
      >
        <div className="mx-auto max-w-[1120px] px-4 py-6 md:px-6 md:py-8">
          {children}
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <BottomNav />
    </div>
  );
}
