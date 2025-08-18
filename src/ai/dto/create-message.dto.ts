export type Role = 'user' | 'assistant' | 'system' | 'tool';

export interface CreateMessageDTO {
  sessionId: number;
  userId?: number | null; // AI면 null
  role: Role; // 'user' | 'assistant' | 'system'
  content: string;

  task?: string | null;
  topics?: string[] | null;
  insight?: string | null;

  model?: string | null;
  tokensIn?: number | null;
  tokensOut?: number | null;
  latencyMs?: number | null;
}
