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

    const data = {
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
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
