"use client";

import { useState, useCallback, useRef } from "react";

interface UseAntiSpamOptions {
  /** Cooldown in milliseconds between allowed clicks (default: 800ms) */
  cooldownMs?: number;
  /** Callback triggered if user rapidly spams clicks */
  onSpamDetected?: (attempts: number) => void;
}

export function useAntiSpam(options: UseAntiSpamOptions = {}) {
  const { cooldownMs = 800, onSpamDetected } = options;
  const [isLocked, setIsLocked] = useState(false);
  const lastClickRef = useRef<number>(0);
  const spamCountRef = useRef<number>(0);

  const executeProtectedAction = useCallback(
    async <T,>(action: () => Promise<T> | T): Promise<T | undefined> => {
      const now = Date.now();
      const elapsed = now - lastClickRef.current;

      if (elapsed < cooldownMs) {
        spamCountRef.current += 1;
        if (onSpamDetected) {
          onSpamDetected(spamCountRef.current);
        }
        return undefined;
      }

      spamCountRef.current = 0;
      lastClickRef.current = now;
      setIsLocked(true);

      try {
        const result = await action();
        return result;
      } finally {
        // Enforce cooldown before unlocking
        setTimeout(() => {
          setIsLocked(false);
        }, cooldownMs);
      }
    },
    [cooldownMs, onSpamDetected]
  );

  return {
    isLocked,
    executeProtectedAction,
  };
}
