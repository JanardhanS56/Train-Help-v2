"use client";

import Link from "next/link";
import { Shield, ArrowRight, LogOut } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { useAuth } from "@/context/auth-context";

export function LandingNavbar() {
  const { user, isAuthenticated, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full bg-surface border-b border-border">
      <div className="max-w-[1120px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded bg-primary text-primary-foreground flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 stroke-[1.5]" />
          </div>
          <span className="font-semibold text-sm text-foreground tracking-tight">
            {APP_NAME}
          </span>
        </Link>

        {/* Center Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-muted-foreground" aria-label="Landing page links">
          <a href="#features" className="hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-foreground transition-colors">
            How it works
          </a>
          <Link href="/help" className="hover:text-foreground transition-colors">
            Help & FAQs
          </Link>
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <div className="hidden sm:flex items-center gap-2 pr-2 border-r border-border text-xs text-muted-foreground">
              <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-[10px]">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : "PA"}
              </span>
              <span className="font-medium text-foreground">{user?.name}</span>
            </div>
          )}

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[8px] bg-primary text-primary-foreground text-xs font-medium hover:bg-primary-hover transition-colors"
          >
            <span>Open Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[1.5]" />
          </Link>

          {isAuthenticated && (
            <button
              type="button"
              id="btn-landing-signout"
              onClick={signOut}
              title="Sign out"
              aria-label="Sign out"
              className="inline-flex items-center gap-1 h-9 px-3 rounded-[8px] border border-border bg-surface text-muted-foreground hover:text-disruption hover:border-disruption/30 text-xs font-medium transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
