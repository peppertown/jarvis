export interface AIResponse {
  raw: unknown;
  response: string;
  provider: string;
  // toolCalls 제거: 이제 Provider 내에서 직접 실행하므로 
  // 상위 레이어(Jarvis)로 전달할 필요 없음
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
  userId?: number;
  sessionId?: number;
  conversationHistory?: Array<{ role: string; content: string }>;
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
