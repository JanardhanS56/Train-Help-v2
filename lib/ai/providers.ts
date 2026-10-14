import { AIChatMessage, AIProviderConfig, AIProviderName } from "./types";
import { TRAIN_ASSISTANT_SYSTEM_PROMPT } from "./system-prompt";

export function getProviderConfig(): AIProviderConfig {
  const provider = (process.env.AI_PROVIDER?.toLowerCase() || "groq") as AIProviderName;
  const apiKey = process.env.AI_API_KEY || "";
  const modelOverride = process.env.AI_MODEL;
  const baseOverride = process.env.AI_BASE_URL;

  switch (provider) {
    case "openrouter":
      return {
        provider: "openrouter",
        apiKey,
        model: modelOverride || "meta-llama/llama-3.3-70b-instruct",
        baseUrl: baseOverride || "https://openrouter.ai/api/v1/chat/completions",
      };
    case "nvidia":
      return {
        provider: "nvidia",
        apiKey,
        model: modelOverride || "meta/llama-3.3-70b-instruct",
        baseUrl: baseOverride || "https://integrate.api.nvidia.com/v1/chat/completions",
      };
    case "mock":
      return {
        provider: "mock",
        apiKey: "",
        model: "offline-mock-engine",
        baseUrl: "",
      };
    case "groq":
    default:
      return {
        provider: "groq",
        apiKey,
        model: modelOverride || "llama-3.3-70b-versatile",
        baseUrl: baseOverride || "https://api.groq.com/openai/v1/chat/completions",
      };
  }
}

export function generateMockTrainResponse(userQuery: string): string {
  const lower = userQuery.toLowerCase();

  if (lower.includes("mumbai")) {
    return `### Recommended Trains to Mumbai:
* **Tejas Rajdhani Express (12952)**
  - *Departure*: 16:55 | *Arrival*: 08:35 (+1 day)
  - *Classes*: 1A, 2A, 3A | *Status*: Available (3A: 28 seats)
  - *Punctuality*: 96% on-time record
* **Golden Temple Mail (12904)**
  - *Departure*: 07:20 | *Arrival*: 05:20 (+1 day)
  - *Classes*: 2A, 3A, SL | *Status*: RAC 4

*Tip: You can select and book these directly via the **Recovery Centre** tab.*`;
  }

  if (lower.includes("delhi")) {
    return `### Trains to New Delhi (NDLS):
* **Bengaluru Rajdhani Express (22691)**
  - *Departure*: 20:00 | *Arrival*: 05:30 (+2 days)
  - *Classes*: 1A, 2A, 3A | *Status*: Confirmed 3A available
* **Karnataka Superfast Express (12627)**
  - *Departure*: 19:20 | *Arrival*: 09:00 (+2 days)
  - *Classes*: 2A, 3A, SL | *Status*: Available (Fare: ₹2,850)

*Recommended*: Bengaluru Rajdhani is rated highest for hygiene (4.6★) and confirmed berths.`;
  }

  if (lower.includes("status") || lower.includes("live") || lower.includes("delay")) {
    return `### Live Status Overview:
* **Train 12628 (Karnataka Express)**: Running on time, approaching Nagpur (Platform 2).
* **Train 22691 (Bengaluru Rajdhani)**: Departing on schedule at 20:00 from SBC.
* **Train 12650 (Karnataka Sampark Kranti)**: Cancelled due to technical rake disruption. (100% full refund initiated to original payment source).`;
  }

  if (lower.includes("tatkal")) {
    return `### Tatkal Booking Windows & Rules:
* **AC Classes (1A, 2A, 3A, CC, EC)**: Opens daily at **10:00 AM IST** on the day prior to journey date.
* **Non-AC Classes (Sleeper)**: Opens daily at **11:00 AM IST** on the day prior to journey date.
* **Important Guidelines**:
  - Maximum 4 passengers per PNR on Tatkal tickets.
  - Zero refund on cancellation of confirmed Tatkal tickets.
  - Keep passenger details pre-filled in your profile for fast checkout.`;
  }

  if (lower.includes("refund")) {
    return `### Refund Policy & Status:
* When a train is cancelled by Indian Railways, a **100% automatic refund** is credited to your source payment account with **zero clerkage charges**.
* Refund processing typically takes **3 to 5 business days**.
* If your train was delayed by >3 hours and you choose not to travel, you can file an online TDR before the train departs.`;
  }

  return `I am your TravelRescue assistant. I can help you with:
- Finding alternative trains and schedules
- Checking Tatkal booking timing and eligibility
- Understanding refund claims and TDR rules
- Choosing between classes (1A, 2A, 3A, SL) and preferred quotas

What journey would you like help with today?`;
}

export async function executeAIChat(
  messages: AIChatMessage[],
  config: AIProviderConfig = getProviderConfig()
): Promise<{ text: string; isMock: boolean; provider: string; model: string }> {
  // If provider is set to mock or if no API key is provided, use resilient mock engine
  if (config.provider === "mock" || !config.apiKey) {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content || "";
    const mockReply = generateMockTrainResponse(lastUserMessage);
    return {
      text: mockReply,
      isMock: true,
      provider: config.provider,
      model: config.model,
    };
  }

  const payloadMessages = [
    { role: "system", content: TRAIN_ASSISTANT_SYSTEM_PROMPT },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.apiKey}`,
  };

  if (config.provider === "openrouter") {
    headers["HTTP-Referer"] = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    headers["X-Title"] = "TravelRescue Train Assistant";
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

  try {
    const res = await fetch(config.baseUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: config.model,
        messages: payloadMessages,
        temperature: 0.3,
        max_tokens: 1024,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorText = await res.text();
      let parsedMessage = errorText;
      try {
        const errJson = JSON.parse(errorText);
        parsedMessage = errJson.error?.message || errorText;
      } catch {
        // use raw text
      }

      if (res.status === 401 || res.status === 403) {
        throw new Error(`Authentication error (${res.status}): Invalid API key for provider ${config.provider}.`);
      } else if (res.status === 429) {
        throw new Error(`Rate limit exceeded (${res.status}) on ${config.provider}. Please wait a moment.`);
      } else {
        throw new Error(`Provider API error (${res.status}): ${parsedMessage}`);
      }
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";
    return {
      text: content,
      isMock: false,
      provider: config.provider,
      model: config.model,
    };
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    const err = error as Error;
    if (err.name === "AbortError") {
      throw new Error(`Request timed out after 20 seconds waiting for ${config.provider}.`);
    }
    throw err;
  }
}
