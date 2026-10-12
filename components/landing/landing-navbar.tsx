"use client";

import Link from "next/link";
import { Shield, ArrowRight } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export function LandingNavbar() {
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
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[8px] bg-primary text-primary-foreground text-xs font-medium hover:bg-primary-hover transition-colors"
          >
            <span>Open Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[1.5]" />
          </Link>
        </div>
      </div>
    </header>
  );
}
