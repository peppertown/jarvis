export interface AIProvider {
  chat(message: string, options?: ChatOptions): Promise<string>;
  getModelName(): string;
  getProviderName(): string;
}

export interface ChatOptions {
  maxTokens?: number;
  temperature?: number;
  systemMessage?: string;
}
