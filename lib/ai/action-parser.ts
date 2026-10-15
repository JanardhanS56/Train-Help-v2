/**
 * lib/ai/action-parser.ts
 * Parser for LLM structured actions returned in assistant responses.
 * Supported protocols:
 * - ACTION:SELECT_ALTERNATIVE:{alternative_id}
 * - ACTION:ADJUST_PREFERENCE:{key}:{value}
 * - ACTION:TRIGGER_SIMULATION:{event_type}
 */

export interface ParsedAction {
  type: "SELECT_ALTERNATIVE" | "ADJUST_PREFERENCE" | "TRIGGER_SIMULATION" | "UNKNOWN";
  raw: string;
  payload: {
    alternativeId?: string;
    preferenceKey?: string;
    preferenceValue?: string;
    simulationEvent?: string;
  };
  label: string;
}

const ACTION_REGEX = /ACTION:(SELECT_ALTERNATIVE|ADJUST_PREFERENCE|TRIGGER_SIMULATION):([^\s\n\]\)]+)/g;

/**
 * Parses action tags from assistant markdown and produces executable action objects
 * along with cleaned message text for the user.
 */
export function parseStructuredActions(content: string): {
  cleanContent: string;
  actions: ParsedAction[];
} {
  const actions: ParsedAction[] = [];
  if (!content) return { cleanContent: "", actions: [] };

  const cleanContent = content.replace(ACTION_REGEX, (match, actionType, param) => {
    if (actionType === "SELECT_ALTERNATIVE") {
      const altId = param.trim();
      actions.push({
        type: "SELECT_ALTERNATIVE",
        raw: match,
        payload: { alternativeId: altId },
        label: `Select Alternative (${altId})`,
      });
    } else if (actionType === "ADJUST_PREFERENCE") {
      const parts = param.split(":");
      const key = parts[0]?.trim();
      const value = parts.slice(1).join(":").trim();
      actions.push({
        type: "ADJUST_PREFERENCE",
        raw: match,
        payload: { preferenceKey: key, preferenceValue: value },
        label: `Set ${key} to ${value}`,
      });
    } else if (actionType === "TRIGGER_SIMULATION") {
      const eventType = param.trim();
      actions.push({
        type: "TRIGGER_SIMULATION",
        raw: match,
        payload: { simulationEvent: eventType },
        label: `Simulate ${eventType.replace(/_/g, " ")}`,
      });
    } else {
      actions.push({
        type: "UNKNOWN",
        raw: match,
        payload: {},
        label: "Execute Action",
      });
    }
    // Remove the raw action tag from display text or replace with empty string
    return "";
  }).trim();

  return { cleanContent, actions };
}
