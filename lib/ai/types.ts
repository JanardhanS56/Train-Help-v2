export type AIProviderName = "groq" | "openrouter" | "nvidia" | "mock";

export interface AIChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIProviderConfig {
  provider: AIProviderName;
  apiKey?: string;
  model: string;
  baseUrl: string;
}

export interface AIChatRequest {
  messages: AIChatMessage[];
  stream?: boolean;
}

export interface AIChatResponse {
  message: AIChatMessage;
  provider: AIProviderName;
  model: string;
  isMockFallback?: boolean;
}
