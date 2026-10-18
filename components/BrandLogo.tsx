"use client";

import React from "react";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export interface BrandLogoProps {
  className?: string;
  boxClassName?: string;
  textClassName?: string;
  showText?: boolean;
  hideTextOnCollapse?: boolean;
  subtitle?: React.ReactNode;
  variant?: "icon" | "wordmark" | "compact";
  size?: "xs" | "sm" | "md" | "lg";
  showTagline?: boolean;
}

const ICON_SIZES: Record<NonNullable<BrandLogoProps["size"]>, { box: string; svg: string; text: string; tagline: string }> = {
  xs: { box: "w-5 h-5", svg: "w-5 h-5", text: "text-xs", tagline: "text-[8px]" },
  sm: { box: "w-7 h-7", svg: "w-7 h-7", text: "text-sm", tagline: "text-[9px]" },
  md: { box: "w-9 h-9", svg: "w-9 h-9", text: "text-base", tagline: "text-[10px]" },
  lg: { box: "w-12 h-12", svg: "w-12 h-12", text: "text-lg", tagline: "text-xs" },
};

function LogoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M18 48V24C18 16.268 24.268 10 32 10C39.732 10 46 16.268 46 24V48L43 54H21L18 48Z"
        className="fill-primary"
      />
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
      <rect x="29" y="32" width="6" height="14" rx="1" className="fill-success" />
      <rect x="25" y="36" width="14" height="6" rx="1" className="fill-success" />
      <rect x="20" y="52" width="8" height="3" rx="1.5" className="fill-primary-foreground" opacity="0.6" />
      <rect x="36" y="52" width="8" height="3" rx="1.5" className="fill-primary-foreground" opacity="0.6" />
      <rect x="29" y="11" width="6" height="3" rx="1.5" className="fill-success" opacity="0.8" />
    </svg>
  );
}

export function BrandLogo({
  className,
  boxClassName,
  textClassName,
  showText = true,
  hideTextOnCollapse = false,
  subtitle,
  variant = "wordmark",
  size = "sm",
  showTagline = false,
}: BrandLogoProps) {
  const s = ICON_SIZES[size];

  const logoNode = (
    <div
      className={cn(
        "relative flex items-center justify-center shrink-0",
        s.box,
        boxClassName,
      )}
      aria-hidden="true"
    >
      <LogoIcon className={s.svg} />
    </div>
  );

  if (variant === "compact" || variant === "icon") {
    return <div className={cn("inline-flex items-center", className)}>{logoNode}</div>;
  }

  if (!showText) {
    return <div className={cn("inline-flex items-center", className)}>{logoNode}</div>;
  }

  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      {logoNode}
      <div className={cn("flex flex-col justify-center", hideTextOnCollapse && "hidden lg:flex")}>
        <span
          className={cn(
            "font-semibold tracking-tight text-foreground",
            s.text,
            textClassName,
          )}
        >
          {APP_NAME}
        </span>
        {subtitle ?? (showTagline ? (
          <div className={cn("uppercase font-mono tracking-wider text-muted-foreground", s.tagline)}>
            Railway Disruption Recovery
          </div>
        ) : null)}
      </div>
    </div>
  );
}
