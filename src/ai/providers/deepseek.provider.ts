// src/services/claude.service.ts
import { Injectable } from '@nestjs/common';
import { AIProvider, AIResponse, ChatOptions } from '../ai.interface';

@Injectable()
export class DeepSeekProvider implements AIProvider {
  private modelName = 'claude-3-sonnet';
  private providerName = 'Anthropic';

  constructor() {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async chat(message: string, options?: ChatOptions): Promise<AIResponse> {
    const API_URL = 'https://api.deepseek.com/v1/chat/completions';
    const API_KEY = process.env.DEEPSEEK_API_KEY;

    const headers = {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    };

    const messages: any[] = [
      {
        role: 'system',
        content: options?.systemMessage || 'You are a helpful assistant.',
      },
    ];

    // 대화 히스토리 추가 (있으면)
    if (
      options?.conversationHistory &&
      options.conversationHistory.length > 0
    ) {
      const chatMessages = options.conversationHistory.filter(
        (msg) => msg.role === 'user' || msg.role === 'assistant',
      );
      messages.push(...chatMessages);
    }

    // 현재 사용자 메시지 추가
    messages.push({ role: 'user', content: message });

    const data = {
      model: 'deepseek-chat',
      messages,
      temperature: options?.temperature || 0.7,
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('API 호출 실패:', error);
      throw error;
    }
  }

  getModelName(): string {
    return this.modelName;
  }

  getProviderName(): string {
    return this.providerName;
  }
}
