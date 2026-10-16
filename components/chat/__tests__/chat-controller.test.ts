import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  openChatAssistant,
  closeChatAssistant,
  toggleChatAssistant,
  subscribeChat,
  getChatSnapshot,
  getChatServerSnapshot,
  resetChatAssistantState,
  getLastTriggerElement,
} from "../chat-controller";
import { handleRouteChangeClose } from "../chat-route-guard";

describe("Chat Controller & Route Guard", () => {
  beforeEach(() => {
    resetChatAssistantState();
    vi.useRealTimers();
  });

  it("initializes with chat closed and server snapshot false", () => {
    expect(getChatSnapshot()).toBe(false);
    expect(getChatServerSnapshot()).toBe(false);
    expect(getLastTriggerElement()).toBeNull();
  });

  it("opens assistant and notifies subscribers", () => {
    const subscriber = vi.fn();
    const unsubscribe = subscribeChat(subscriber);

    const mockTrigger = { focus: vi.fn() } as unknown as HTMLElement;
    openChatAssistant(mockTrigger);

    expect(getChatSnapshot()).toBe(true);
    expect(getLastTriggerElement()).toBe(mockTrigger);
    expect(subscriber).toHaveBeenCalledTimes(1);

    unsubscribe();
  });

  it("toggles open and closed", () => {
    toggleChatAssistant();
    expect(getChatSnapshot()).toBe(true);

    toggleChatAssistant();
    expect(getChatSnapshot()).toBe(false);
  });

  it("restores focus on standard closeChatAssistant", async () => {
    vi.useFakeTimers();
    const mockFocus = vi.fn();
    const mockTrigger = { focus: mockFocus } as unknown as HTMLElement;

    openChatAssistant(mockTrigger);
    expect(getChatSnapshot()).toBe(true);

    closeChatAssistant({ restoreFocus: true });
    expect(getChatSnapshot()).toBe(false);

    vi.advanceTimersByTime(60);
    expect(mockFocus).toHaveBeenCalledTimes(1);
    expect(getLastTriggerElement()).toBeNull();
  });

  it("clears trigger and does NOT restore trigger focus when closing on route change", async () => {
    vi.useFakeTimers();
    const mockFocus = vi.fn();
    const mockTrigger = { focus: mockFocus } as unknown as HTMLElement;

    openChatAssistant(mockTrigger);
    expect(getChatSnapshot()).toBe(true);

    closeChatAssistant({ restoreFocus: false });
    expect(getChatSnapshot()).toBe(false);
    expect(getLastTriggerElement()).toBeNull();

    vi.advanceTimersByTime(60);
    expect(mockFocus).not.toHaveBeenCalled();
  });

  it("handleRouteChangeClose closes assistant without focus restore only on path change", () => {
    const mockClose = vi.fn();

    // Initial render: no close
    const initialResult = handleRouteChangeClose({
      currentPath: "/dashboard",
      previousPath: null,
      isOpen: true,
      close: mockClose,
    });
    expect(initialResult).toBe(false);
    expect(mockClose).not.toHaveBeenCalled();

    // Same path: no close
    const samePathResult = handleRouteChangeClose({
      currentPath: "/dashboard",
      previousPath: "/dashboard",
      isOpen: true,
      close: mockClose,
    });
    expect(samePathResult).toBe(false);
    expect(mockClose).not.toHaveBeenCalled();

    // Different path but already closed: no close
    const closedResult = handleRouteChangeClose({
      currentPath: "/recovery",
      previousPath: "/dashboard",
      isOpen: false,
      close: mockClose,
    });
    expect(closedResult).toBe(false);
    expect(mockClose).not.toHaveBeenCalled();

    // Different path and assistant open: closes with restoreFocus: false
    const navResult = handleRouteChangeClose({
      currentPath: "/recovery",
      previousPath: "/dashboard",
      isOpen: true,
      close: mockClose,
    });
    expect(navResult).toBe(true);
    expect(mockClose).toHaveBeenCalledWith({ restoreFocus: false });
  });
});
