import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { AIProvider } from '../ai.interface';
import { GptProvider } from '../providers/gpt.provider';
import { ClaudeProvider } from '../providers/claude.provider';
import {
  extractFirstJsonChunk,
  parseAnalyzeResult,
} from '../utils/jarvis.util';
@Injectable()
export class JarvisHelper {
  private openai: OpenAI;
  private jarvis_model: 'gpt-4o-mini';

  constructor(
    private gpt: GptProvider,
    private claude: ClaudeProvider,
  ) {}

  // 사용자 요청 카테고리 분석
  // 타입 수정 필요(analyzeResult 타입 추가 필요)
  async analyzeQuery(query: string): Promise<any> {
    const prompt = `
You are a router. Return STRICT JSON.

Schema:
{
  "task": "code|analysis|explain|creative|chat|retrieve|summarize|translate|plan|transact|control",
  "topics": ["sports|finance|tech|travel|cooking|health|entertainment|education|law|career|productivity|gaming|personal|other"],
  "insight": "<short useful fact about the USER or empty string>"
}

Rules for "insight":
- ONLY output if it is a durable, actionable fact about the USER:
  * preference (likes/dislikes), goal/plan, skill/experience level, constraint (time/budget/device), habit/routine.
- If the message is just a personal feeling/event (e.g., "I ate and I'm full"), output "" (empty string).
- Keep it one short sentence, Korean if the input is Korean.

Text: "${query.replace(/"/g, '\\"')}"
`;

    const response = await this.gpt.chat(prompt, {
      model: this.jarvis_model,
      maxTokens: 200,
      temperature: 0,
    });

    const extractJson = extractFirstJsonChunk(response.response);
    const parsed = parseAnalyzeResult(extractJson);

    return parsed;
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
