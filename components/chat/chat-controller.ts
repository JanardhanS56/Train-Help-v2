"use client";

import { useEffect, useState } from "react";

/**
 * Singleton controller for the AI Assistant panel.
 * Ensures only one panel exists, tracks open state, and handles returning
 * focus to the trigger element when the panel is closed.
 */
type ChatListener = (isOpen: boolean) => void;
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
  listeners.forEach((l) => l(true));
}

export function closeChatAssistant() {
  chatIsOpen = false;
  listeners.forEach((l) => l(false));
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
}

export function toggleChatAssistant(trigger?: HTMLElement | null) {
  if (chatIsOpen) {
    closeChatAssistant();
  } else {
    openChatAssistant(trigger);
  }
}

export function useChatAssistantState() {
  const [isOpen, setIsOpen] = useState(chatIsOpen);

  useEffect(() => {
    const listener: ChatListener = (open) => setIsOpen(open);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    isOpen,
    openChat: openChatAssistant,
    closeChat: closeChatAssistant,
    toggleChat: toggleChatAssistant,
  };
}
