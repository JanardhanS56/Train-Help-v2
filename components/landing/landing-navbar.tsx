"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { TrainFront, ArrowRight, LogOut, Menu, X } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { useAuth } from "@/context/auth-context";
import { useLandingNavScroll } from "./use-landing-nav-scroll";

interface NavLinkItem {
  name: string;
  href: string;
  isHash: boolean;
  sectionId?: string;
}

const NAV_ITEMS: NavLinkItem[] = [
  { name: "Features", href: "#features", isHash: true, sectionId: "features" },
  {
    name: "How it works",
    href: "#how-it-works",
    isHash: true,
    sectionId: "how-it-works",
  },
  { name: "Simulation", href: "/simulation", isHash: false, sectionId: "simulation" },
  { name: "Help & FAQs", href: "/help", isHash: false, sectionId: "help" },
  { name: "Privacy", href: "/privacy", isHash: false, sectionId: "privacy" },
];

interface LandingNavbarProps {
  enableScrollHide?: boolean;
}

export function LandingNavbar({ enableScrollHide = false }: LandingNavbarProps) {
  const { user, isAuthenticated, signOut } = useAuth();
  const [legacyScrolled, setLegacyScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement | null>(null);
  const toggleBtnRef = useRef<HTMLButtonElement | null>(null);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
    toggleBtnRef.current?.focus();
  }, []);

  const {
    navRef,
    isVisible,
    isScrolled: navScrolled,
    instantReveal,
    triggerAnchorNav,
    handleFocusIn,
    handleFocusOut,
  } = useLandingNavScroll({
    enabled: enableScrollHide,
    isMenuOpen,
  });

  const isScrolled = enableScrollHide ? navScrolled : legacyScrolled;

  // 1. Sticky scroll listener for non-landing pages
  useEffect(() => {
    if (enableScrollHide) return;
    const handleScroll = () => {
      setLegacyScrolled(window.scrollY > 24);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [enableScrollHide]);

  // 2. Scroll-spy via IntersectionObserver
  useEffect(() => {
    const sectionIds = ["features", "how-it-works", "simulation", "help", "privacy"];
    const elements: HTMLElement[] = [];

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) elements.push(el);
    });

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-20% 0px -60% 0px",
        threshold: 0.1,
      }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // 3. Mobile menu focus trap & body scroll lock

  useEffect(() => {
    if (!isMenuOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    // Focus first interactive element inside menu
    const menuEl = menuRef.current;
    if (menuEl) {
      const focusables = menuEl.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length > 0) {
        focusables[0]?.focus();
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeMenu();
        return;
      }

      if (e.key === "Tab" && menuRef.current) {
        const focusables = Array.from(
          menuRef.current.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen, closeMenu]);

  const handleHashClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (enableScrollHide) {
      triggerAnchorNav();
    }
    const targetEl = document.querySelector(href);
    if (targetEl) {
      e.preventDefault();
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      targetEl.scrollIntoView({
        behavior: prefersReducedMotion ? "instant" : "smooth",
        block: "start",
      });
      history.pushState(null, "", href);
    }
  };

  const handleLinkClick = () => {
    if (enableScrollHide) {
      triggerAnchorNav();
    }
  };

  return (
    <>
      {/* Skip to Content Link (Accessibility) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 z-50 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium shadow-lg ring-2 ring-primary focus:outline-none"
      >
        Skip to content
      </a>

      <header
        ref={enableScrollHide ? (navRef as React.RefObject<HTMLElement>) : undefined}
        data-landing-nav={enableScrollHide ? "true" : undefined}
        data-nav-hidden={enableScrollHide && !isVisible ? "true" : undefined}
        data-instant-reveal={enableScrollHide && instantReveal ? "true" : undefined}
        onFocusCapture={enableScrollHide ? handleFocusIn : undefined}
        onBlurCapture={enableScrollHide ? handleFocusOut : undefined}
        className={`${
          enableScrollHide
            ? `fixed top-0 left-0 right-0 z-40 w-full bg-surface ${
                instantReveal
                  ? ""
                  : "transition-transform duration-200 ease-out motion-reduce:transition-none"
              } ${
                !isVisible
                  ? "-translate-y-[calc(100%+1px)]"
                  : "translate-y-0"
              } ${
                isScrolled
                  ? "h-16 border-b border-border shadow-2xs"
                  : "h-16 border-b border-transparent"
              }`
            : `sticky top-0 z-40 w-full bg-surface ${
                isScrolled
                  ? "h-14 border-b border-border shadow-2xs"
                  : "h-16 border-b border-border"
              }`
        }`}
      >
        <div className="max-w-[1120px] mx-auto px-4 md:px-6 h-full flex items-center justify-between gap-4">
          {/* 1. Logo */}
          <Link
            href="/"
            onClick={handleLinkClick}
            className="flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md p-1"
          >
            <div className="w-6 h-6 rounded bg-primary text-primary-foreground flex items-center justify-center">
              <TrainFront className="w-3.5 h-3.5 stroke-[1.5]" />
            </div>
            <span className="font-semibold text-sm text-foreground tracking-tight">
              {APP_NAME}
            </span>
          </Link>

          {/* 2. Middle Navigation Links (Desktop) */}
          <nav
            className="hidden md:flex items-center gap-6 text-xs font-medium text-muted-foreground"
            aria-label="Primary navigation"
          >
            {NAV_ITEMS.map((item) => {
              const isCurrent =
                item.sectionId && activeSection === item.sectionId;

              if (item.isHash) {
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    aria-current={isCurrent ? "true" : undefined}
                    onClick={(e) => handleHashClick(e, item.href)}
                    className={`transition-colors hover:text-foreground py-1 px-0.5 relative ${
                      isCurrent
                        ? "text-foreground font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
                        : ""
                    }`}
                  >
                    {item.name}
                  </a>
                );
              }

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  aria-current={isCurrent ? "true" : undefined}
                  onClick={handleLinkClick}
                  className={`transition-colors hover:text-foreground py-1 px-0.5 relative ${
                    isCurrent
                      ? "text-foreground font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
                      : ""
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* 3. Right Controls: User Chip, Dashboard, Sign Out, Mobile Hamburger */}
          <div className="flex items-center gap-2.5">
            {/* User Chip when signed in */}
            {isAuthenticated && (
              <div className="hidden sm:flex items-center gap-2 pr-2 border-r border-border text-xs text-muted-foreground">
                <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-[10px]">
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : "PA"}
                </span>
                <span className="font-medium text-foreground">{user?.name}</span>
              </div>
            )}

            {/* Open Dashboard CTA (Always visible outside mobile drawer) */}
            <Link
              href="/dashboard"
              onClick={handleLinkClick}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[8px] bg-primary text-primary-foreground text-xs font-medium hover:bg-primary-hover transition-colors shadow-xs focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <span>Open Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[1.5]" />
            </Link>

            {/* Sign Out (when authenticated) */}
            {isAuthenticated && (
              <button
                type="button"
                id="btn-landing-signout"
                onClick={signOut}
                title="Sign out"
                aria-label="Sign out"
                className="inline-flex items-center gap-1 h-9 px-3 rounded-[8px] border border-border bg-surface text-muted-foreground hover:text-disruption hover:border-disruption/30 text-xs font-medium transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            )}

            {/* Mobile Hamburger Button */}
            <button
              ref={toggleBtnRef}
              type="button"
              id="btn-mobile-menu"
              aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-navigation-drawer"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="md:hidden p-2 rounded-lg border border-border text-foreground hover:bg-muted/40 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation with Focus Trap & Escape */}
      {isMenuOpen && (
        <div
          id="mobile-navigation-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
          className="fixed inset-0 top-16 z-50 md:hidden bg-background/95 backdrop-blur-md flex flex-col justify-between p-6 border-b border-border shadow-xl"
        >
          <div ref={menuRef} className="space-y-6">
            <nav
              className="flex flex-col space-y-4 text-base font-medium text-foreground"
              aria-label="Mobile menu links"
            >
              {NAV_ITEMS.map((item) => {
                const isCurrent =
                  item.sectionId && activeSection === item.sectionId;

                if (item.isHash) {
                  return (
                    <a
                      key={item.name}
                      href={item.href}
                      aria-current={isCurrent ? "true" : undefined}
                      onClick={(e) => {
                        closeMenu();
                        handleHashClick(e, item.href);
                      }}
                      className={`py-2 px-3 rounded-lg transition-colors ${
                        isCurrent
                          ? "bg-primary/10 text-primary font-semibold"
                          : "hover:bg-muted/40"
                      }`}
                    >
                      {item.name}
                    </a>
                  );
                }

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    aria-current={isCurrent ? "true" : undefined}
                    onClick={() => {
                      closeMenu();
                      handleLinkClick();
                    }}
                    className={`py-2 px-3 rounded-lg transition-colors ${
                      isCurrent
                        ? "bg-primary/10 text-primary font-semibold"
                        : "hover:bg-muted/40"
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="pt-6 border-t border-hairline flex flex-col gap-3">
            {isAuthenticated && (
              <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs">
                    {user?.name ? user.name.slice(0, 2).toUpperCase() : "PA"}
                  </span>
                  <div>
                    <span className="font-semibold text-foreground block">
                      {user?.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Signed in
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    closeMenu();
                    signOut();
                  }}
                  className="px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-disruption hover:border-disruption/30 transition-colors text-xs font-medium"
                >
                  Sign out
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={closeMenu}
              className="w-full py-2.5 rounded-lg border border-border bg-surface text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Close Menu
            </button>
          </div>
        </div>
      )}
    </>
  );
}
