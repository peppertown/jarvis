import { Injectable } from '@nestjs/common';
import { ChatOptions } from './ai.interface';
import { JarvisHelper } from './helpers/jarvis.helper';
import { ChatRepository } from '../modules/chat/chat.repository';
import { pickModelAndTokens } from './utils/jarvis.util';

@Injectable()
export class Jarvis {
  constructor(
    private helper: JarvisHelper,
    private chatRepo: ChatRepository,
  ) {}

  // 타입 수정 필요
  async chat(message: string, options?: ChatOptions): Promise<any> {
    const userId = options?.userId || 1; // 기본값으로 1 사용
    const sessionId = options?.sessionId || 1; // 기본값으로 1 사용

    await this.chatRepo.createMessage({
      sessionId: sessionId,
      userId: userId,
      role: 'user',
      content: message,
    });

    // 현재 세션의 대화 히스토리 가져오기 (현재 메시지 제외)
    const conversationHistory =
      await this.chatRepo.getConversationHistory(sessionId);
    // 방금 저장한 사용자 메시지는 제외 (마지막 메시지 제거)
    conversationHistory.pop();

    const category = await this.helper.analyzeQuery(message);
    const selectedProvider = this.helper.selectBestAI(category.task);

    // 대화 연속성과 MCP 도구 사용을 위한 시스템 메시지
    const systemMessage =
      conversationHistory.length > 0
        ? `당신은 Jarvis AI 어시스턴트입니다. 이전 대화 내용을 참고하여 맥락에 맞는 연속적인 대화를 진행하세요. 사용자와의 대화 히스토리를 기억하고 일관성 있게 응답하세요.

중요한 지침:
- 사용자에 대한 중요한 정보(선호도, 취향, 기술수준, 목표 등)를 발견하면 save-insight 도구를 사용하여 저장하세요.
- 도구를 사용하더라도 반드시 사용자의 질문에 대한 유용하고 구체적인 답변을 함께 제공해야 합니다.
- 도구 사용은 백그라운드 작업이며, 사용자에게는 항상 질문에 맞는 실질적인 도움을 주세요.`
        : `당신은 Jarvis AI 어시스턴트입니다. 사용자를 도와주는 친근하고 유용한 AI입니다.

중요한 지침:
- 사용자에 대한 중요한 정보(선호도, 취향, 기술수준, 목표 등)를 발견하면 save-insight 도구를 사용하여 저장하세요.
- 도구를 사용하더라도 반드시 사용자의 질문에 대한 유용하고 구체적인 답변을 함께 제공해야 합니다.
- 도구 사용은 백그라운드 작업이며, 사용자에게는 항상 질문에 맞는 실질적인 도움을 주세요.`;

    const started = performance.now();
    const { raw, response, provider } = await selectedProvider.chat(message, {
      ...options,
      conversationHistory,
      systemMessage,
    });

    const latencyMs = Math.round(performance.now() - started);

    const { model, tokensIn, tokensOut } = pickModelAndTokens(raw);

    await this.chatRepo.createMessage({
      sessionId: sessionId,
      userId: null,
      role: 'assistant',
      content: response,
      task: category.task,
      topics: category.topics,
      insight: category.insight || null,
      model: model ?? null,
      tokensIn: tokensIn ?? null,
      tokensOut: tokensOut ?? null,
      latencyMs,
    });

    return { response, provider };
  }
}
