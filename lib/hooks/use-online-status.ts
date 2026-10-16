"use client";

import { useSyncExternalStore } from "react";

/**
 * Returns current navigator.onLine status or true in SSR.
 */
export function getOnlineSnapshot(): boolean {
  if (typeof navigator !== "undefined") {
    return navigator.onLine;
  }
  return true;
}

/**
 * Subscribes to browser 'online' and 'offline' window events.
 * Returns an unsubscription callback.
 */
export function subscribeOnlineStatus(callback: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);

  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

/**
 * React hook to observe navigator.onLine status with zero hydration tearing.
 * Defaults to true during SSR.
 */
export function useOnlineStatus(): boolean {
  return useSyncExternalStore(
    subscribeOnlineStatus,
    getOnlineSnapshot,
    () => true
  );
}
