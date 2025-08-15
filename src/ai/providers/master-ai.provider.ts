import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { AIProvider, ChatOptions } from '../ai.interface';
import { GptProvider } from './gpt.provider';
import { ClaudeProvider } from './claude.provider';
@Injectable()
export class MasterAIProvider implements AIProvider {
  private openai: OpenAI;
  private modelName = 'gpt-4o-mini';
  private providerName = 'OpenAI';

  constructor(
    private gpt: GptProvider,
    private claude: ClaudeProvider,
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  // 사용자 요청 카테고리 분석
  private async analyzeQuery(query: string): Promise<string> {
    const prompt = `${process.env.ANALYZE_QUERY_PROMPT} 질문:${query}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 10,
      temperature: 0.1,
    });

    return response.choices[0].message.content.trim().toLowerCase();
  }

  // 요청 카테고리별 가장 적합한 AI 모델 선정
  private selectBestAI(category: string): AIProvider {
    switch (category) {
      case 'code':
      case 'analysis':
      case 'creative':
        return this.claude; // 논리적 사고, 분석력

      case 'explain':
      case 'chat':
      default:
        return this.gpt; // 창의성, 대화
    }
  }

  async chat(message: string, options?: ChatOptions): Promise<string> {
    const category = await this.analyzeQuery(message);

    const selectedProvider = this.selectBestAI(category);

    const response = await selectedProvider.chat(message, options);

    return response;
  }

  getModelName(): string {
    return this.modelName;
  }

  getProviderName(): string {
    return this.providerName;
  }
}
