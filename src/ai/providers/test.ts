import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { AIProvider, AIResponse, ChatOptions } from '../ai.interface';
@Injectable()
export class StreamTest implements AIProvider {
  private openai: OpenAI;
  private modelName = 'gpt-4o';
  private providerName = 'OpenAI';

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async chat(message: string, options?: ChatOptions): Promise<AIResponse> {
    const messages: any[] = [];

    if (options?.systemMessage) {
      messages.push({ role: 'system', content: options.systemMessage });
    }
    messages.push({ role: 'user', content: message });

    const response = await this.openai.chat.completions.create({
      model: options?.model || 'gpt-4o-mini',
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

  async *chatStream(
    message: string,
    options?: ChatOptions,
  ): AsyncGenerator<string> {
    const messages: any[] = [];
    if (options?.systemMessage) {
      messages.push({ role: 'system', content: options.systemMessage });
    }
    messages.push({ role: 'user', content: message });

    const stream = await this.openai.chat.completions.create({
      model: options?.model || 'gpt-4o-mini',
      messages,
      max_tokens: options?.maxTokens ?? 1000,
      temperature: options?.temperature ?? 0.7,
      stream: true, // ★ 스트리밍
      stream_options: { include_usage: true },
    });

    let usage: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    } | null = null;

    for await (const part of stream) {
      const delta = part?.choices?.[0]?.delta?.content ?? '';

      if (delta) {
        yield delta; // 토큰 조각을 바깥으로 흘려보냄
      }

      if ((part as any).usage) {
        usage = (part as any).usage;
        console.log(usage);
      }
    }
  }

  getModelName(): string {
    return this.modelName;
  }

  getProviderName(): string {
    return this.providerName;
  }
}
