/**
 * components/ui/brand-logo.tsx
 *
 * Unified brand logo component for TravelRescue.
 *
 * Variants:
 *   - "icon"     → Standalone logomark only (train front + rescue cross)
 *   - "wordmark" → Icon + "TravelRescue" text
 *   - "compact"  → Small icon-only for collapsed sidebar / mobile
 *
 * Automatically adapts to light/dark theme via CSS currentColor + token vars.
 */

import React from "react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

export type BrandLogoVariant = "icon" | "wordmark" | "compact";

interface BrandLogoProps {
  /** Which visual variant to render */
  variant?: BrandLogoVariant;
  /** Overall size class — controls the icon dimension */
  size?: "xs" | "sm" | "md" | "lg";
  /** Extra className for the wrapper */
  className?: string;
  /** Whether to show the tagline under the wordmark */
  showTagline?: boolean;
}

/* ── Size mappings ── */
const ICON_SIZES: Record<NonNullable<BrandLogoProps["size"]>, { box: string; svg: string; text: string; tagline: string }> = {
  xs: { box: "w-5 h-5",   svg: "w-5 h-5",   text: "text-xs",    tagline: "text-[8px]" },
  sm: { box: "w-7 h-7",   svg: "w-7 h-7",   text: "text-sm",    tagline: "text-[9px]" },
  md: { box: "w-9 h-9",   svg: "w-9 h-9",   text: "text-base",  tagline: "text-[10px]" },
  lg: { box: "w-12 h-12", svg: "w-12 h-12", text: "text-lg",    tagline: "text-xs" },
};

/**
 * TravelRescue Logomark SVG
 *
 * A geometric front-view train with an integrated rescue cross.
 * Uses navy (#1E3A5F) as primary and teal (#2F7D6B) as accent in light mode.
 * In dark mode the CSS variables automatically apply the dark token equivalents.
 */
function LogoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Train body — front view, rounded top */}
      <path
        d="M18 48V24C18 16.268 24.268 10 32 10C39.732 10 46 16.268 46 24V48L43 54H21L18 48Z"
        className="fill-primary"
      />

      {/* Windshield — two pane windows */}
      <path
        d="M23 21C23 18.239 25.239 16 28 16H30.5V28H23V21Z"
        className="fill-primary-foreground"
        opacity="0.9"
      />
      <path
        d="M33.5 16H36C38.761 16 41 18.239 41 21V28H33.5V16Z"
        className="fill-primary-foreground"
        opacity="0.9"
      />

      {/* Rescue cross — central teal accent */}
      <rect x="29" y="32" width="6" height="14" rx="1" className="fill-success" />
      <rect x="25" y="36" width="14" height="6" rx="1" className="fill-success" />

      {/* Bottom rail / wheels */}
      <rect x="20" y="52" width="8" height="3" rx="1.5" className="fill-primary-foreground" opacity="0.6" />
      <rect x="36" y="52" width="8" height="3" rx="1.5" className="fill-primary-foreground" opacity="0.6" />

      {/* Headlight — top center */}
      <rect x="29" y="11" width="6" height="3" rx="1.5" className="fill-success" opacity="0.8" />
    </svg>
  );
}

export function BrandLogo({
  variant = "wordmark",
  size = "sm",
  className,
  showTagline = false,
}: BrandLogoProps) {
  const s = ICON_SIZES[size];

  if (variant === "compact" || variant === "icon") {
    return (
      <div
        className={cn(
          "flex items-center justify-center shrink-0",
          s.box,
          className,
        )}
      >
        <LogoIcon className={s.svg} />
      </div>
    );
  }

  /* variant === "wordmark" */
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "flex items-center justify-center shrink-0",
          s.box,
        )}
      >
        <LogoIcon className={s.svg} />
      </div>
      <div className="leading-tight">
        <span
          className={cn(
            "font-semibold tracking-tight text-foreground",
            s.text,
          )}
        >
          {APP_NAME}
        </span>
        {showTagline && (
          <div
            className={cn(
              "uppercase font-mono tracking-wider text-muted-foreground",
              s.tagline,
            )}
          >
            Railway Disruption Recovery
          </div>
        )}
      </div>
    </div>
  );
}
