import { Injectable } from '@nestjs/common';
import { ChatOptions } from './ai.interface';
import { JarvisHelper } from './helpers/jarvis.helper';
import { ChatRepository } from '../modules/chat/chat.repository';
import { pickModelAndTokens } from './utils/jarvis.util';
import { McpService } from '../mcp/mcp.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class Jarvis {
  constructor(
    private helper: JarvisHelper,
    private chatRepo: ChatRepository,
    private mcpService: McpService, // MCP 오케스트레이션을 위한 서비스
    private prisma: PrismaService, // 인사이트 저장용
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

🔍 인사이트 저장 규칙 (중요):
- 오직 사용자의 현재 메시지(마지막 메시지)에서만 새로운 정보를 찾아 save-insight 도구를 사용하세요.
- 이전 대화 내용은 맥락 참고용일 뿐, 인사이트 저장 대상이 아닙니다.
- 이미 알고 있는 정보나 이전에 언급된 내용은 다시 저장하지 마세요.
- 현재 메시지에 진짜 새로운 정보(선호도, 취향, 기술수준, 목표 등)가 있을 때만 저장하세요.
- 인사이트 내용은 간결하고 명확하게 작성하세요 (예: "React 개발 선호", "TypeScript 학습중")

💬 응답 원칙:
- 도구를 사용하더라도 반드시 사용자의 질문에 대한 유용하고 구체적인 답변을 함께 제공해야 합니다.
- 도구 사용은 백그라운드 작업이며, 사용자에게는 항상 질문에 맞는 실질적인 도움을 주세요.`
        : `당신은 Jarvis AI 어시스턴트입니다. 사용자를 도와주는 친근하고 유용한 AI입니다.

🔍 인사이트 저장 규칙 (중요):
- 사용자의 현재 메시지에서 중요한 새로운 정보(선호도, 취향, 기술수준, 목표 등)를 발견하면 save-insight 도구를 사용하여 저장하세요.
- 진짜 새로운 정보가 있을 때만 저장하고, 일반적이거나 임시적인 내용은 저장하지 마세요.
- 인사이트 내용은 간결하고 명확하게 작성하세요 (예: "React 개발 선호", "TypeScript 학습중")

💬 응답 원칙:
- 도구를 사용하더라도 반드시 사용자의 질문에 대한 유용하고 구체적인 답변을 함께 제공해야 합니다.
- 도구 사용은 백그라운드 작업이며, 사용자에게는 항상 질문에 맞는 실질적인 도움을 주세요.`;

    // 🎯 MCP 오케스트레이션 시작: AI Provider + 도구 관리의 중앙 집중식 처리
    console.log('🎭 [Jarvis] Starting MCP orchestration...');

    const started = performance.now();

    // 🔧 1단계: 선택된 Provider에 맞는 MCP 도구 목록 준비
    let tools: any[] = [];
    if (selectedProvider.constructor.name === 'GptProvider') {
      tools = this.mcpService.getToolsForOpenAI();
      console.log(
        '🔧 [Jarvis] Prepared OpenAI tools:',
        tools.map((t) => t.function.name),
      );
    } else if (selectedProvider.constructor.name === 'ClaudeProvider') {
      tools = this.mcpService.getToolsForClaude();
      console.log(
        '🔧 [Jarvis] Prepared Claude tools:',
        tools.map((t) => t.name),
      );
    }

    // 🚀 2단계: Provider를 통한 첫 번째 AI 호출 (도구 목록 포함)
    const aiResponse = await selectedProvider.chat(message, {
      ...options,
      conversationHistory,
      systemMessage,
      tools, // Provider별 도구 형식 전달
    });

    let finalResponse = aiResponse.response;
    let totalLatencyMs = Math.round(performance.now() - started);

    // 🛠️ 3단계: 도구 호출이 있는 경우 MCP 오케스트레이션 실행
    if (aiResponse.toolCalls && aiResponse.toolCalls.length > 0) {
      console.log(
        '🛠️ [Jarvis] Processing',
        aiResponse.toolCalls.length,
        'tool calls...',
      );

      // 도구들을 병렬로 실행하여 성능 최적화
      const toolExecutionPromises = aiResponse.toolCalls.map(
        async (toolCall) => {
          try {
            console.log(
              `🔧 [Jarvis] Executing: ${toolCall.name}`,
              toolCall.parameters,
            );
            // save-insight 도구의 경우 userId를 자동 주입
            let enhancedParameters = toolCall.parameters;
            if (toolCall.name === 'save-insight') {
              enhancedParameters = {
                ...toolCall.parameters,
                userId: userId,
                sessionId: sessionId,
              };
            }
            
            const result = await this.mcpService.executeTool(
              toolCall.name,
              enhancedParameters,
            );
            console.log(`✅ [Jarvis] Tool ${toolCall.name} completed:`, result);
            return { success: true, toolCall, result };
          } catch (error) {
            console.error(`❌ [Jarvis] Tool ${toolCall.name} failed:`, error);
            return { success: false, toolCall, error };
          }
        },
      );

      const toolResults = await Promise.all(toolExecutionPromises);
      const successfulTools = toolResults.filter((r) => r.success);
      const failedTools = toolResults.filter((r) => !r.success);

      if (failedTools.length > 0) {
        console.warn(
          `⚠️ [Jarvis] ${failedTools.length} tools failed, but continuing...`,
        );
      }

      // 📝 4단계: 도구 호출 후 빈 응답 처리 (Follow-up)
      if (!finalResponse.trim()) {
        console.log(
          '🔄 [Jarvis] AI response is empty, requesting follow-up...',
        );

        const followUpStarted = performance.now();

        // Follow-up 요청을 위한 새로운 대화 히스토리 구성
        const updatedHistory = [
          ...conversationHistory,
          { role: 'user', content: message },
          {
            role: 'assistant',
            content: `도구를 사용하여 ${successfulTools.length}개의 작업을 완료했습니다.`,
          },
        ];

        try {
          const followUpResponse = await selectedProvider.chat(
            '이전 대화 내용을 참고하여 맥락에 맞는 연속적인 대화를 진행하세요. 사용자와의 대화 히스토리를 기억하고 일관성 있게 응답하세요.',
            {
              ...options,
              conversationHistory: updatedHistory,
              systemMessage:
                '당신은 Jarvis AI 어시스턴트입니다. 사용자에게 도움이 되는 구체적인 답변을 제공하세요.',
              // Follow-up에서는 도구 사용하지 않음
            },
          );

          if (followUpResponse.response.trim()) {
            finalResponse = followUpResponse.response;
            console.log(
              '✅ [Jarvis] Follow-up response received:',
              finalResponse.length,
              'chars',
            );
          } else {
            finalResponse = '요청하신 작업을 처리했습니다.';
            console.log('⚠️ [Jarvis] Follow-up also empty, using fallback');
          }
        } catch (error) {
          console.error('❌ [Jarvis] Follow-up request failed:', error);
          finalResponse = '요청하신 작업을 처리했습니다.';
        }

        totalLatencyMs += Math.round(performance.now() - followUpStarted);
      }

      console.log(
        `🎉 [Jarvis] MCP orchestration complete: ${successfulTools.length} tools executed`,
      );
    } else {
      console.log('💬 [Jarvis] No tool calls, direct response');
    }

    // 📊 5단계: 성능 및 토큰 정보 수집
    const { model, tokensIn, tokensOut } = pickModelAndTokens(aiResponse.raw);

    // 💾 6단계: 최종 응답을 데이터베이스에 저장
    const savedMessage = await this.chatRepo.createMessage({
      sessionId: sessionId,
      userId: null,
      role: 'assistant',
      content: finalResponse,
      task: category.task,
      topics: category.topics,
      model: model ?? null,
      tokensIn: tokensIn ?? null,
      tokensOut: tokensOut ?? null,
      latencyMs: totalLatencyMs,
    });

    // 💡 6.5단계: 기존 분석 로직으로 추출된 인사이트도 Insight 테이블에 저장
    if (category.insight && category.insight.trim()) {
      try {
        await this.prisma.insight.upsert({
          where: {
            userId_content: {
              userId: userId,
              content: category.insight,
            }
          },
          update: {
            sessionId: sessionId,
            messageId: savedMessage.id,
          },
          create: {
            userId: userId,
            sessionId: sessionId,
            messageId: savedMessage.id,
            content: category.insight,
            source: 'JarvisHelper-Analysis',
          },
        });
        console.log('💡 [Jarvis] Analysis-based insight saved:', category.insight);
      } catch (error) {
        console.error('❌ [Jarvis] Failed to save analysis insight:', error);
      }
    }

    console.log('💾 [Jarvis] Response saved to database');

    // 🎯 7단계: 클라이언트에게 최종 응답 반환
    return {
      response: finalResponse,
      provider: aiResponse.provider,
      toolsExecuted: aiResponse.toolCalls?.length || 0,
    };
  }
}
