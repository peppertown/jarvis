import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AIProvider, AIResponse, ChatOptions } from '../ai.interface';

@Injectable()
export class GptProvider implements AIProvider {
  private openai: OpenAI;
  private modelName = 'gpt-4o';
  private providerName = 'OpenAI';

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('ai.openai.apiKey'),
    });
  }

  async chat(message: string, options?: ChatOptions): Promise<AIResponse> {
    const messages: any[] = [];

    if (options?.systemMessage) {
      messages.push({ role: 'system', content: options.systemMessage });
    }

    // 대화 히스토리 추가 (있으면)
    if (
      options?.conversationHistory &&
      options.conversationHistory.length > 0
    ) {
      // 시스템 메시지가 이미 추가되었으므로 user/assistant만 추가
      const chatMessages = options.conversationHistory.filter(
        (msg) => msg.role === 'user' || msg.role === 'assistant',
      );
      messages.push(...chatMessages);
    }

    // 현재 사용자 메시지 추가
    messages.push({ role: 'user', content: message });

    const response = await this.openai.chat.completions.create({
      model: options?.model || 'gpt-4o',
      messages,
      max_tokens: options?.maxTokens || 1000,
      temperature: options?.temperature || 0.7,
    });

    return {
      raw: response,
      response: response.choices[0].message.content,
      provider: this.modelName,
    };
  }

  getModelName(): string {
    return this.modelName;
  }

  getProviderName(): string {
    return this.providerName;
  }
}
