import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { AIProvider, AIResponse, ChatOptions } from '../ai.interface';

@Injectable()
export class ClaudeProvider implements AIProvider {
  private anthropic: Anthropic;
  private modelName = 'claude-3-sonnet';
  private providerName = 'Anthropic';

  constructor(private configService: ConfigService) {
    this.anthropic = new Anthropic({
      apiKey: this.configService.get<string>('ai.anthropic.apiKey'),
    });
  }

  async chat(message: string, options?: ChatOptions): Promise<AIResponse> {
    const messages: any[] = [];

    // 대화 히스토리 추가 (있으면)
    if (
      options?.conversationHistory &&
      options.conversationHistory.length > 0
    ) {
      // 시스템 메시지는 제외하고 user/assistant 메시지만 추가
      const chatMessages = options.conversationHistory.filter(
        (msg) => msg.role === 'user' || msg.role === 'assistant',
      );
      messages.push(...chatMessages);
    }

    // 현재 사용자 메시지 추가
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
