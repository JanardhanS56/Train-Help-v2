/**
 * lib/data/chat.ts
 * Supabase-backed persistence for multi-turn assistant messages.
 * Stores conversation messages in `chat_messages` table with in-memory / local fallback.
 */

import { getSupabaseClient } from "./supabase-client";

export interface DbChatMessage {
  id?: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  actions?: unknown;
  created_at?: string;
}

export interface ChatSaveResult {
  success: boolean;
  storage: "supabase" | "local";
  messageId: string;
  error?: string;
}

// In-memory fallback storage
const memoryChatStore = new Map<string, DbChatMessage[]>();

export async function saveChatMessage(
  message: Omit<DbChatMessage, "id" | "created_at"> & { id?: string }
): Promise<ChatSaveResult> {
  const supabase = getSupabaseClient();
  const id = message.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const record: DbChatMessage = {
    ...message,
    id,
    created_at: now,
  };

  // Always update in-memory mirror
  const convId = message.conversation_id;
  const existing = memoryChatStore.get(convId) || [];
  memoryChatStore.set(convId, [...existing, record]);

  if (!supabase) {
    return {
      success: true,
      storage: "local",
      messageId: id,
    };
  }

  try {
    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        id: record.id,
        conversation_id: record.conversation_id,
        role: record.role,
        content: record.content,
        actions: record.actions || null,
        created_at: record.created_at,
      })
      .select("id")
      .single();

    if (error) {
      console.warn("Supabase chat_messages insert failed, falling back to local memory:", error.message);
      return {
        success: true,
        storage: "local",
        messageId: id,
        error: error.message,
      };
    }

    return {
      success: true,
      storage: "supabase",
      messageId: data?.id || id,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn("Error saving chat message to Supabase:", errorMsg);
    return {
      success: true,
      storage: "local",
      messageId: id,
      error: errorMsg,
    };
  }
}

export async function getChatHistory(conversationId: string): Promise<{
  messages: DbChatMessage[];
  storage: "supabase" | "local";
}> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      messages: memoryChatStore.get(conversationId) || [],
      storage: "local",
    };
  }

  try {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error || !data) {
      console.warn("Failed to load chat history from Supabase, returning local store:", error?.message);
      return {
        messages: memoryChatStore.get(conversationId) || [],
        storage: "local",
      };
    }

    return {
      messages: data as DbChatMessage[],
      storage: "supabase",
    };
  } catch (err: unknown) {
    console.warn("Error fetching chat history from Supabase:", err);
    return {
      messages: memoryChatStore.get(conversationId) || [],
      storage: "local",
    };
  }
}

export async function clearChatHistory(conversationId: string): Promise<boolean> {
  memoryChatStore.delete(conversationId);
  const supabase = getSupabaseClient();
  if (!supabase) return true;

  try {
    await supabase.from("chat_messages").delete().eq("conversation_id", conversationId);
    return true;
  } catch {
    return false;
  }
}
