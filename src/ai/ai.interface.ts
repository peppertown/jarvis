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
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemMessage?: string;
}

// 사용자의 질문&요청 대분류
export type TaskIntent =
  | 'code'
  | 'analysis'
  | 'explain'
  | 'creative'
  | 'chat'
  | 'retrieve'
  | 'summarize'
  | 'translate'
  | 'plan'
  | 'transact'
  | 'control';

// 질문&요청 주제 소분류
export type TopicTag =
  | 'sports'
  | 'finance'
  | 'tech'
  | 'travel'
  | 'cooking'
  | 'health'
  | 'entertainment'
  | 'education'
  | 'law'
  | 'career'
  | 'productivity'
  | 'gaming'
  | 'personal'
  | 'other';
