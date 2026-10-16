"use client";

import dynamic from "next/dynamic";

/**
 * Client-only dynamic wrapper for ChatAssistant to avoid SSR bundle bloat.
 */
export const ChatAssistant = dynamic(
  () => import("@/components/chat/chat-assistant").then((m) => m.ChatAssistant),
  {
    ssr: false,
    loading: () => null,
  }
);
