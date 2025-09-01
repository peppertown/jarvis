export type Role = 'user' | 'assistant' | 'system' | 'tool';

export interface CreateMessageDTO {
  sessionId: number;
  userId?: number | null; // AI면 null
  role: Role; // 'user' | 'assistant' | 'system'
  content: string;

  // 성능 분석용 필드들만 유지
  model?: string | null;
  tokensIn?: number | null;
  tokensOut?: number | null;
  latencyMs?: number | null;
}
