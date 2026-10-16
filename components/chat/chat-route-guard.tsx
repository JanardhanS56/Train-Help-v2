"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { closeChatAssistant, getChatSnapshot, type CloseChatOptions } from "./chat-controller";

export interface RouteChangeHandlerOptions {
  currentPath: string;
  previousPath: string | null;
  isOpen: boolean;
  close: (options: CloseChatOptions) => void;
}

/**
 * Pure helper determining whether assistant should close on route navigation.
 * Returns true if the route changed while assistant was open, and invokes close.
 */
export function handleRouteChangeClose({
  currentPath,
  previousPath,
  isOpen,
  close,
}: RouteChangeHandlerOptions): boolean {
  if (previousPath !== null && previousPath !== currentPath && isOpen) {
    close({ restoreFocus: false });
    return true;
  }
  return false;
}

export function ChatRouteGuard() {
  const pathname = usePathname();
  const prevPathRef = useRef<string | null>(null);

  useEffect(() => {
    handleRouteChangeClose({
      currentPath: pathname,
      previousPath: prevPathRef.current,
      isOpen: getChatSnapshot(),
      close: closeChatAssistant,
    });
    prevPathRef.current = pathname;
  }, [pathname]);

  return null;
}
