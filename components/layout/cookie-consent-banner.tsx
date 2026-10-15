"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, ShieldCheck, X } from "lucide-react";

const COOKIE_STORAGE_KEY = "travelrescue_cookie_consent_v1";

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if consent has already been recorded
    try {
      const stored = localStorage.getItem(COOKIE_STORAGE_KEY);
      if (!stored) {
        // Gentle delay before revealing banner
        const timer = setTimeout(() => setIsVisible(true), 900);
        return () => clearTimeout(timer);
      }
    } catch {
      // LocalStorage unavailable in incognito or restricted environment
    }
  }, []);

  const handleConsent = (level: "all" | "essential") => {
    try {
      localStorage.setItem(
        COOKIE_STORAGE_KEY,
        JSON.stringify({
          level,
          analytics: level === "all",
          functional: true,
          date: new Date().toISOString(),
        })
      );
    } catch {
      // Ignore storage errors
    }
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          role="region"
          aria-label="Cookie and Privacy Consent"
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.96 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-[80] pointer-events-auto"
        >
          <div className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-surface/95 backdrop-blur-md shadow-2xl space-y-3.5 text-xs text-foreground">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  <Cookie className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">
                    Passenger Privacy & Cookie Notice
                  </h3>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-success" />
                    <span>Compliant with Indian Railway Passenger Charter</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleConsent("essential")}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded"
                aria-label="Dismiss cookie notice with essential cookies only"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-muted-foreground text-[11px] leading-relaxed">
              We use strictly functional cookies to preserve your travel recovery filters, seat preferences, and active PNR status. We never sell passenger journey data.
            </p>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-hairline">
              <Link
                href="/privacy"
                className="text-[11px] text-primary hover:underline font-medium"
              >
                Read Privacy Policy →
              </Link>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleConsent("essential")}
                  className="px-3 py-1.5 rounded-md border border-border bg-background hover:bg-muted/50 text-foreground text-xs font-medium transition-colors"
                >
                  Essential Only
                </button>
                <button
                  type="button"
                  onClick={() => handleConsent("all")}
                  className="px-3.5 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-medium transition-colors shadow-xs"
                >
                  Accept All
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
