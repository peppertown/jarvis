import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { AIProvider } from '../ai.interface';
import { GptProvider } from '../providers/gpt.provider';
import { ClaudeProvider } from '../providers/claude.provider';
@Injectable()
export class JarvisHelper {
  private openai: OpenAI;

  constructor(
    private gpt: GptProvider,
    private claude: ClaudeProvider,
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  // 사용자 요청 카테고리 분석
  async analyzeQuery(query: string): Promise<string> {
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
  selectBestAI(category: string): AIProvider {
    switch (category) {
      case 'code':
      case 'analysis':
      case 'creative':
        return this.claude;

      case 'explain':
      case 'chat':
      default:
        return this.gpt;
    }
  }

  // 사용자 요청을 통한 데이터 추출
  async extractUserData(query: string) {
    const prompt = `${process.env.EXTRACT_QUERY_PROMPT} 질문: "${query}"`;

    const response = await this.openai.chat.completions.create({
      model: this.gpt.getModelName(),
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 100,
      temperature: 0.3,
    });

    return response.choices[0].message.content;
  }
}
