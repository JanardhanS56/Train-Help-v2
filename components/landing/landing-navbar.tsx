"use client";

import Link from "next/link";
import { Shield, ArrowRight } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export function LandingNavbar() {
  return (
    <header className="sticky top-0 z-40 w-full bg-surface border-b border-border">
      <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 touch-target">
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
          <span className="font-bold text-base text-foreground tracking-tight">
            {APP_NAME}
          </span>
        </Link>

        {/* Center Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-muted-foreground" aria-label="Landing page links">
          <a href="#features" className="hover:text-foreground transition-colors touch-target">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-foreground transition-colors touch-target">
            How it works
          </a>
          <Link href="/help" className="hover:text-foreground transition-colors touch-target">
            Help & FAQs
          </Link>
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary-hover transition-colors touch-target shadow-card"
          >
            <span>Get Started</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
