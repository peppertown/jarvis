import { Injectable } from '@nestjs/common';
import { AIProvider, TaskIntent } from '../ai.interface';
import { GptProvider } from '../providers/gpt.provider';
import { ClaudeProvider } from '../providers/claude.provider';
@Injectable()
export class JarvisHelper {
  private jarvis_model: 'gpt-4o-mini';

  constructor(
    private gpt: GptProvider,
    private claude: ClaudeProvider,
  ) {}

  // 사용자 요청의 태스크 유형만 분류 (AI 제공자 선택용)
  async getTaskOnly(query: string): Promise<string> {
    const prompt = `
You are a task classifier. Return ONLY the task type as a single word.

Task types:
- code: programming, coding, debugging, technical implementation
- analysis: data analysis, research, investigation, comparison
- explain: explanation, teaching, clarification, how-to
- creative: writing, brainstorming, creative tasks, storytelling
- chat: casual conversation, greetings, personal talk
- retrieve: searching, finding information, lookup
- summarize: summarizing, condensing information
- translate: language translation, localization
- plan: planning, scheduling, organizing, strategy
- transact: transactions, purchases, financial operations
- control: system control, automation, commands

Text: "${query.replace(/"/g, '\\"')}"

Return only one word from the task types above.
`;

    const response = await this.gpt.chat(prompt, {
      model: this.jarvis_model,
      maxTokens: 50,
      temperature: 0,
    });

    return response.response.trim().toLowerCase();
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
}
