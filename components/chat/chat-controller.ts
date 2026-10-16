"use client";

import { useSyncExternalStore, useCallback } from "react";

/**
 * External store controller for the AI Assistant panel.
 * Uses useSyncExternalStore to eliminate state tearing and race conditions.
 * Tracks open state and manages accessibility focus on open/close/route change.
 */
type ChatListener = () => void;
const listeners = new Set<ChatListener>();
let chatIsOpen = false;
let lastTriggerElement: HTMLElement | null = null;

export function openChatAssistant(trigger?: HTMLElement | null) {
  if (trigger) {
    lastTriggerElement = trigger;
  } else if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
    lastTriggerElement = document.activeElement;
  }
  chatIsOpen = true;
  listeners.forEach((l) => l());
}

export interface CloseChatOptions {
  restoreFocus?: boolean;
}

export function closeChatAssistant(options?: CloseChatOptions) {
  const shouldRestore = !options || options.restoreFocus !== false;
  chatIsOpen = false;
  listeners.forEach((l) => l());

  if (shouldRestore) {
    if (lastTriggerElement && typeof lastTriggerElement.focus === "function") {
      const el = lastTriggerElement;
      lastTriggerElement = null;
      setTimeout(() => {
        try {
          el.focus();
        } catch {
          // Ignore focus error if unmounted
        }
      }, 50);
    }
  } else {
    // Route change close: clear detached trigger and move focus safely to main content
    lastTriggerElement = null;
    if (typeof document !== "undefined") {
      const mainContent = document.getElementById("main-content");
      if (mainContent && typeof mainContent.focus === "function") {
        try {
          mainContent.focus();
        } catch {
          // Ignore focus error
        }
      }
    }
  }
}

export function toggleChatAssistant(trigger?: HTMLElement | null) {
  if (chatIsOpen) {
    closeChatAssistant({ restoreFocus: true });
  } else {
    openChatAssistant(trigger);
  }
}

export function subscribeChat(listener: ChatListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getChatSnapshot(): boolean {
  return chatIsOpen;
}

export function getChatServerSnapshot(): boolean {
  return false;
}

export function resetChatAssistantState() {
  chatIsOpen = false;
  lastTriggerElement = null;
  listeners.clear();
}

export function getLastTriggerElement(): HTMLElement | null {
  return lastTriggerElement;
}

export function setLastTriggerElement(el: HTMLElement | null) {
  lastTriggerElement = el;
}

export function useChatAssistantState() {
  const isOpen = useSyncExternalStore(
    subscribeChat,
    getChatSnapshot,
    getChatServerSnapshot
  );

  const openChat = useCallback((trigger?: HTMLElement | null) => openChatAssistant(trigger), []);
  const closeChat = useCallback((options?: CloseChatOptions) => closeChatAssistant(options), []);
  const toggleChat = useCallback((trigger?: HTMLElement | null) => toggleChatAssistant(trigger), []);

  return {
    isOpen,
    openChat,
    closeChat,
    toggleChat,
  };
}
