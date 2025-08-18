// src/services/claude.service.ts
import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { AIProvider, AIResponse, ChatOptions } from '../ai.interface';

@Injectable()
export class ClaudeProvider implements AIProvider {
  private anthropic: Anthropic;
  private modelName = 'claude-3-sonnet';
  private providerName = 'Anthropic';

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async chat(message: string, options?: ChatOptions): Promise<AIResponse> {
    const messages: any[] = [];

    if (options?.systemMessage) {
      // Claude는 system 메시지를 별도로 처리
    }
    messages.push({ role: 'user', content: message });

    const response = await this.anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: options?.maxTokens || 1000,
      messages,
      system: options?.systemMessage,
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return {
        raw: response,
        response: content.text,
        provider: this.modelName,
      };
    }
  }

  getModelName(): string {
    return this.modelName;
  }

  getProviderName(): string {
    return this.providerName;
  }
}
