import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';
import { AIProvider, TaskIntent } from '../ai.interface';
import { GptProvider } from '../providers/gpt.provider';
import { ClaudeProvider } from '../providers/claude.provider';
import {
  extractFirstJsonChunk,
  parseAnalyzeResult,
} from '../utils/jarvis.util';
@Injectable()
export class JarvisHelper {
  private openai: OpenAI;
  private jarvis_model = 'gpt-5-mini';

  constructor(
    private gpt: GptProvider,
    private claude: ClaudeProvider,
    private configService: ConfigService,
  ) {
    // 라우팅 전용 순수 OpenAI 클라이언트 (MCP 없음)
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('ai.openai.apiKey'),
    });
  }

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

    // 라우팅 전용 순수 OpenAI 클라이언트 사용 (MCP 도구 없음)
    // 빠르고 간단한 분석만 수행, 불필요한 도구 호출 방지
    const response = await this.openai.chat.completions.create({
      model: this.jarvis_model,
      messages: [{ role: 'user', content: prompt }],
      max_completion_tokens: 500,
      temperature: 1,
    });

    const extractJson = extractFirstJsonChunk(
      response.choices[0].message.content,
    );
    const parsed = parseAnalyzeResult(extractJson);

    return parsed;
  }

  // 요청 카테고리별 가장 적합한 AI 모델 선정
  selectBestAI(task: TaskIntent): AIProvider {
    switch (task) {
      // Claude 강점: 코드 작성, 긴 분석
      case 'code':
      case 'analysis':
        return this.claude;

      // Claude 강점: 창의적 글쓰기, 설명, 대화
      case 'creative':
      case 'explain':
        return this.claude;

      // GPT 우선: 요약, 번역, 계획, 일상 대화
      case 'summarize':
      case 'translate':
      case 'plan':
      case 'chat':
        return this.gpt;

      // 추가: transact/control 같은 건 나중에 외부 API 호출/Agent 붙일 예정
      case 'transact':
      case 'control':
        return this.gpt; // 임시로 GPT, 나중에 전용 provider 붙일 수 있음

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
