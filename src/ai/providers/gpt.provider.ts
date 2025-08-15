import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { AIProvider, ChatOptions } from '../ai.interface';
@Injectable()
export class GptProvider implements AIProvider {
  private openai: OpenAI;
  private modelName = 'gpt-4o';
  private providerName = 'OpenAI';

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async chat(message: string, options?: ChatOptions): Promise<string> {
    const messages: any[] = [];

    if (options?.systemMessage) {
      messages.push({ role: 'system', content: options.systemMessage });
    }
    messages.push({ role: 'user', content: message });

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: options?.maxTokens || 1000,
      temperature: options?.temperature || 0.7,
    });

    return response.choices[0].message.content;
  }

  getModelName(): string {
    return this.modelName;
  }

  getProviderName(): string {
    return this.providerName;
  }
}
