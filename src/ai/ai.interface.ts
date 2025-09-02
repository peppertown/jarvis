export interface AIResponse {
  raw: unknown;
  response: string;
  provider: string;
  // MCP 도구 호출 정보 - Jarvis가 오케스트레이션하기 위해 필요
  toolCalls?: Array<{
    name: string;        // 호출할 도구 이름 (예: 'save-insight')
    parameters: any;     // 도구에 전달할 파라미터
  }>;
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
  tools?: any[]; // MCP 도구 목록 (Provider별로 형식이 다름)
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
