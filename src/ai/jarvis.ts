import { Injectable } from '@nestjs/common';
import { ChatOptions } from './ai.interface';
import { JarvisHelper } from './helpers/jarvis.helper';
import { ChatRepository } from '../modules/chat/chat.repository';
import { McpService } from '../mcp/mcp.service';
import { pickModelAndTokens } from './utils/jarvis.util';

@Injectable()
export class Jarvis {
  constructor(
    private helper: JarvisHelper,
    private chatRepo: ChatRepository,
    private mcpService: McpService,
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

    const task = await this.helper.getTaskOnly(message);
    const selectedProvider = this.helper.selectBestAI(task as any);

    // 대화 연속성 및 MCP 도구 사용을 위한 시스템 메시지
    const baseMessage =
      '당신은 Jarvis AI 어시스턴트입니다. 사용자를 도와주는 친근하고 유용한 AI입니다.';
    const mcpInstructions =
      '\n\n중요한 사용자 정보(선호도, 목표, 기술 수준, 제약사항, 습관 등)를 발견하면 save-insight 도구를 사용해서 저장하세요. 대화 주제가 명확할 때는 categorize-topics 도구로 주제를 분류하세요. 이러한 도구들은 필요할 때만 자연스럽게 사용하세요.';

    const systemMessage =
      conversationHistory.length > 0
        ? baseMessage +
          ' 이전 대화 내용을 참고하여 맥락에 맞는 연속적인 대화를 진행하세요. 사용자와의 대화 히스토리를 기억하고 일관성 있게 응답하세요.' +
          mcpInstructions
        : baseMessage + mcpInstructions;

    const started = performance.now();
    const { raw, response, provider, toolCalls } = await selectedProvider.chat(
      message,
      {
        ...options,
        conversationHistory,
        systemMessage,
        sessionId, // MCP 도구에서 필요
      },
    );

    const latencyMs = Math.round(performance.now() - started);

    // MCP 도구 호출 실행
    if (toolCalls && toolCalls.length > 0) {
      for (const toolCall of toolCalls) {
        try {
          const toolResult = await this.mcpService.executeTool(toolCall.name, {
            ...toolCall.parameters,
            sessionId,
          });
          console.log(`Tool ${toolCall.name} executed:`, toolResult);
        } catch (error) {
          console.error(`Tool ${toolCall.name} execution failed:`, error);
        }
      }
    }

    const { model, tokensIn, tokensOut } = pickModelAndTokens(raw);

    await this.chatRepo.createMessage({
      sessionId: sessionId,
      userId: null,
      role: 'assistant',
      content: response,
      model: model ?? null,
      tokensIn: tokensIn ?? null,
      tokensOut: tokensOut ?? null,
      latencyMs,
    });

    return { response, provider, toolCalls };
  }
}
