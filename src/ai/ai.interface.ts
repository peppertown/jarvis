export interface AIResponse {
  response: string;
  provider: string;
}

export interface AIProvider {
  chat(message: string, options?: ChatOptions): Promise<AIResponse>;
  getModelName(): string;
  getProviderName(): string;
}

export interface ChatOptions {
  maxTokens?: number;
  temperature?: number;
  systemMessage?: string;
}
