"use client";

import React from "react";
import Image from "next/image";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export interface BrandLogoProps {
  className?: string;
  boxClassName?: string;
  textClassName?: string;
  showText?: boolean;
  hideTextOnCollapse?: boolean;
  subtitle?: React.ReactNode;
}

export function BrandLogo({
  className,
  boxClassName,
  textClassName,
  showText = true,
  hideTextOnCollapse = false,
  subtitle,
}: BrandLogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      {/* 44x44 rounded cream box with amber border and train image */}
      <div
        className={cn(
          "relative flex items-center justify-center shrink-0 w-[44px] h-[44px] rounded-[12px] bg-[#FFF6E5] border-[1.5px] border-[#F5A623] select-none",
          boxClassName
        )}
        style={{
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(245, 166, 35, 0.12)",
        }}
        aria-hidden="true"
      >
        <Image
          src="/logo-train.png"
          alt="TravelRescue Steam Train Logo"
          width={32}
          height={32}
          className="w-full h-full object-contain p-[6px]"
          priority
        />
      </div>

      {/* TravelRescue text */}
      {showText && (
        <div
          className={cn(
            "flex flex-col justify-center",
            hideTextOnCollapse && "hidden lg:flex"
          )}
        >
          <span
            className={cn(
              "font-semibold text-sm text-foreground tracking-tight",
              textClassName
            )}
          >
            {APP_NAME}
          </span>
          {subtitle}
        </div>
      )}
    </div>
  );
}
