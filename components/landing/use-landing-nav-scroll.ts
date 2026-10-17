"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { nextNavState, INITIAL_NAV_SCROLL_STATE, NavScrollState } from "./nav-scroll";

interface UseLandingNavScrollOptions {
  enabled?: boolean;
  isMenuOpen?: boolean;
}

export function useLandingNavScroll({
  enabled = true,
  isMenuOpen = false,
}: UseLandingNavScrollOptions = {}) {
  const [effectiveVisible, setEffectiveVisible] = useState<boolean>(true);
  const [isScrolled, setIsScrolled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.scrollY > 8;
    }
    return false;
  });
  const [instantReveal, setInstantReveal] = useState<boolean>(false);

  const navRef = useRef<HTMLElement | null>(null);
  const scrollStateRef = useRef<NavScrollState>({ ...INITIAL_NAV_SCROLL_STATE });
  const rAFIdRef = useRef<number | null>(null);
  const isKeyboardUserRef = useRef<boolean>(false);
  const viewportWidthRef = useRef<number>(0);
  const anchorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const anchorMaxCapRef = useRef<NodeJS.Timeout | null>(null);

  const overridesRef = useRef({
    keyboardFocus: false,
    pointerAtTop: false,
    anchorNav: false,
    menuOpen: isMenuOpen,
  });

  // Track previous menu state to reset baseline when menu closes
  const prevMenuOpenRef = useRef(isMenuOpen);
  useEffect(() => {
    overridesRef.current.menuOpen = isMenuOpen;
    if (prevMenuOpenRef.current && !isMenuOpen) {
      // Menu just closed: reset baseline to current scrollY
      const currentY = typeof window !== "undefined" ? Math.max(0, window.scrollY) : 0;
      scrollStateRef.current = {
        scrollVisible: true,
        lastY: currentY,
        acc: 0,
        dir: 0,
      };
    }
    prevMenuOpenRef.current = isMenuOpen;
  }, [isMenuOpen]);

  // Helper to re-evaluate effective visibility and only trigger React state on actual change
  const evaluateVisibility = useCallback(() => {
    const hasOverride =
      overridesRef.current.keyboardFocus ||
      overridesRef.current.pointerAtTop ||
      overridesRef.current.anchorNav ||
      overridesRef.current.menuOpen;

    const nextVisible = scrollStateRef.current.scrollVisible || hasOverride;
    setEffectiveVisible((prev) => (prev !== nextVisible ? nextVisible : prev));
  }, []);

  const resetBaseline = useCallback(() => {
    if (typeof window === "undefined") return;
    const currentY = Math.max(0, window.scrollY);
    scrollStateRef.current = {
      scrollVisible: true,
      lastY: currentY,
      acc: 0,
      dir: 0,
    };
    evaluateVisibility();
  }, [evaluateVisibility]);

  // Public method to initiate anchor nav override when a link is clicked
  const triggerAnchorNav = useCallback(() => {
    overridesRef.current.anchorNav = true;
    evaluateVisibility();

    if (anchorTimeoutRef.current) clearTimeout(anchorTimeoutRef.current);
    if (anchorMaxCapRef.current) clearTimeout(anchorMaxCapRef.current);

    const endAnchor = () => {
      overridesRef.current.anchorNav = false;
      if (anchorTimeoutRef.current) clearTimeout(anchorTimeoutRef.current);
      if (anchorMaxCapRef.current) clearTimeout(anchorMaxCapRef.current);
      resetBaseline();
    };

    if (typeof window !== "undefined" && "onscrollend" in window) {
      window.addEventListener("scrollend", endAnchor, { once: true });
    }

    // Safety fallback: 150ms debounce after last scroll, capped at 1500ms
    anchorMaxCapRef.current = setTimeout(endAnchor, 1500);
  }, [evaluateVisibility, resetBaseline]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    viewportWidthRef.current = window.innerWidth;
    const currentY = Math.max(0, window.scrollY);
    scrollStateRef.current = {
      scrollVisible: true,
      lastY: currentY,
      acc: 0,
      dir: 0,
    };

    // Track user input mode (keyboard vs pointer) to prevent mouse clicks pinning nav
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        isKeyboardUserRef.current = true;
      }
    };
    const handlePointerDown = () => {
      isKeyboardUserRef.current = false;
    };
    window.addEventListener("keydown", handleKeyDown, { capture: true, passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { capture: true, passive: true });

    // Handle bfcache and scroll restoration
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        resetBaseline();
      }
    };
    window.addEventListener("pageshow", handlePageShow);

    // 1. Passive Scroll Listener throttled by rAF
    const onScroll = () => {
      if (rAFIdRef.current !== null) return;

      rAFIdRef.current = requestAnimationFrame(() => {
        rAFIdRef.current = null;
        const rawY = window.scrollY;
        const maxY = Math.max(
          0,
          document.documentElement.scrollHeight - window.innerHeight
        );

        setIsScrolled((prev) => {
          const next = rawY > 8;
          return prev !== next ? next : prev;
        });

        // If anchor nav is active, ignore scroll direction updates
        if (overridesRef.current.anchorNav) {
          if (anchorTimeoutRef.current) clearTimeout(anchorTimeoutRef.current);
          anchorTimeoutRef.current = setTimeout(() => {
            overridesRef.current.anchorNav = false;
            resetBaseline();
          }, 150);
          return;
        }

        const next = nextNavState(scrollStateRef.current, rawY, { maxY });
        scrollStateRef.current = next;
        evaluateVisibility();
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    // 2. ResizeObserver for --nav-h
    let resizeObserver: ResizeObserver | null = null;
    const navEl = navRef.current;
    if (navEl && "ResizeObserver" in window) {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const height = Math.round(entry.borderBoxSize?.[0]?.blockSize || entry.contentRect.height);
          if (height > 0) {
            document.documentElement.style.setProperty("--nav-h", `${height}px`);
          }
        }
      });
      resizeObserver.observe(navEl);
    }

    // 3. Viewport Resize: only reset baseline when WIDTH changes
    const onWindowResize = () => {
      const currentWidth = window.innerWidth;
      if (currentWidth !== viewportWidthRef.current) {
        viewportWidthRef.current = currentWidth;
        resetBaseline();
      }
    };
    window.addEventListener("resize", onWindowResize, { passive: true });

    // 4. Pointer at top edge (for fine pointer devices only)
    const finePointerMQL = window.matchMedia("(pointer: fine)");
    const onPointerMove = (e: PointerEvent) => {
      if (!finePointerMQL.matches) return;

      const navHeight = navRef.current?.offsetHeight || 72;
      const isNearTopEdge = e.clientY <= 8;

      if (isNearTopEdge) {
        if (!overridesRef.current.pointerAtTop) {
          overridesRef.current.pointerAtTop = true;
          evaluateVisibility();
        }
      } else if (overridesRef.current.pointerAtTop) {
        // Release when pointer leaves (clientY > navHeight + 8)
        if (e.clientY > navHeight + 8) {
          overridesRef.current.pointerAtTop = false;
          resetBaseline();
        }
      }
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });

    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
      window.removeEventListener("pointerdown", handlePointerDown, { capture: true });
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onWindowResize);
      window.removeEventListener("pointermove", onPointerMove);
      if (rAFIdRef.current !== null) {
        cancelAnimationFrame(rAFIdRef.current);
      }
      if (anchorTimeoutRef.current) clearTimeout(anchorTimeoutRef.current);
      if (anchorMaxCapRef.current) clearTimeout(anchorMaxCapRef.current);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [enabled, evaluateVisibility, resetBaseline]);

  // Focus-in and Focus-out handlers for Nav element
  const handleFocusIn = useCallback((e: React.FocusEvent) => {
    try {
      const target = e.target as HTMLElement | null;
      const isFocusVisible =
        target?.matches(":focus-visible") ?? isKeyboardUserRef.current;

      if (isFocusVisible) {
        overridesRef.current.keyboardFocus = true;
        setInstantReveal(true);
        setEffectiveVisible(true);
      }
    } catch {
      if (isKeyboardUserRef.current) {
        overridesRef.current.keyboardFocus = true;
        setInstantReveal(true);
        setEffectiveVisible(true);
      }
    }
  }, []);

  const handleFocusOut = useCallback(
    (e: React.FocusEvent) => {
      const nextTarget = e.relatedTarget as Node | null;
      if (!navRef.current?.contains(nextTarget)) {
        overridesRef.current.keyboardFocus = false;
        setInstantReveal(false);
        resetBaseline();
      }
    },
    [resetBaseline]
  );

  // When mobile menu is open, navbar is always visible
  const isVisible = isMenuOpen || effectiveVisible;

  return {
    navRef,
    isVisible,
    isScrolled,
    instantReveal,
    triggerAnchorNav,
    handleFocusIn,
    handleFocusOut,
  };
}
