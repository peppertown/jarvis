import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AIProvider, AIResponse, ChatOptions } from '../ai.interface';
import { McpService } from '../../mcp/mcp.service';

@Injectable()
export class GptProvider implements AIProvider {
  private openai: OpenAI;
  private modelName = 'gpt-4o';
  private providerName = 'OpenAI';

  constructor(
    private configService: ConfigService,
    private mcpService: McpService, // MCP 도구 관리를 위한 서비스 주입
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('ai.openai.apiKey'),
    });
  }

  async chat(message: string, options?: ChatOptions): Promise<AIResponse> {
    const messages: any[] = [];

    if (options?.systemMessage) {
      messages.push({ role: 'system', content: options.systemMessage });
    }

    // 대화 히스토리 추가 (있으면)
    if (
      options?.conversationHistory &&
      options.conversationHistory.length > 0
    ) {
      // 시스템 메시지가 이미 추가되었으므로 user/assistant만 추가
      const chatMessages = options.conversationHistory.filter(
        (msg) => msg.role === 'user' || msg.role === 'assistant',
      );
      messages.push(...chatMessages);
    }

    // 현재 사용자 메시지 추가
    messages.push({ role: 'user', content: message });

    // MCP 도구들을 OpenAI Function Calling 형식으로 가져오기
    // 이 도구들은 AI가 필요할 때 자율적으로 사용할 수 있음
    const tools = this.mcpService.getToolsForOpenAI();

    console.log(
      '🔧 Available tools:',
      tools.map((t) => t.function.name),
    );
    console.log('💬 Request messages:', messages.length, 'messages');

    const response = await this.openai.chat.completions.create({
      model: options?.model || 'gpt-4o',
      messages,
      max_tokens: options?.maxTokens || 2000, // 도구 호출 + 텍스트 응답을 위해 토큰 증가
      temperature: options?.temperature || 0.7,
      tools: tools, // OpenAI에게 사용 가능한 도구들 제공
      tool_choice: 'auto', // AI가 자동으로 도구 사용 여부를 판단
    });

    const choice = response.choices[0];
    console.log('🤖 AI Response - Finish reason:', choice.finish_reason);
    console.log(
      '📝 AI Response - Content:',
      choice.message.content ? 'Yes' : 'No',
    );
    console.log(
      '🛠️ AI Response - Tool calls:',
      choice.message.tool_calls?.length || 0,
    );

    // 중요: OpenAI API의 응답 구조 이해
    // - choice.message.content: AI의 텍스트 응답 (도구만 호출시 null일 수 있음)
    // - choice.message.tool_calls: AI가 호출한 도구들의 배열
    // - finish_reason: 'stop' (정상 완료) vs 'tool_calls' (도구 호출로 인한 정지)

    // 도구 호출 정보 수집
    const toolCalls = choice.message.tool_calls || [];
    const textResponse = choice.message.content || '';

    // 🚀 핵심: 도구들을 Provider 내에서 즉시 실행
    // AI가 선택한 도구들을 바로 실행하여 부작용(인사이트 저장 등) 처리
    if (toolCalls.length > 0) {
      console.log('🚀 Executing tools in provider...');

      for (const toolCall of toolCalls) {
        if (toolCall.type === 'function') {
          try {
            // 도구 파라미터 파싱
            const parameters = JSON.parse(toolCall.function.arguments);

            console.log(
              `🔧 Executing tool: ${toolCall.function.name}`,
              parameters,
            );

            // MCP 서비스를 통해 실제 도구 실행
            const toolResult = await this.mcpService.executeTool(
              toolCall.function.name,
              parameters,
            );

            console.log(
              `✅ Tool executed successfully: ${toolCall.function.name}`,
              toolResult,
            );
          } catch (error) {
            // 도구 실행 실패 시 로그만 찍고 계속 진행
            // 사용자 응답에는 영향을 주지 않음
            console.error(
              `❌ Tool execution failed: ${toolCall.function.name}`,
              error,
            );
          }
        }
      }
    }

    // 🎯 중요한 개선점:
    // 도구가 실행되었지만 텍스트 응답이 없는 경우를 처리
    // 이제 도구는 백그라운드에서 실행되었고, 사용자에게는 텍스트 응답만 전달
    let finalResponse = textResponse;

    // 💡 새로운 해결책: 도구 호출 시 빈 응답이면 다시 요청해서 실제 답변 받기
    if (!finalResponse && toolCalls.length > 0) {
      console.log(
        '🔄 AI provided tools but no text response. Requesting actual response...',
      );

      // 도구 실행 결과를 포함해서 다시 요청
      const followUpMessages = [...messages];

      // AI의 도구 호출을 메시지에 추가
      followUpMessages.push({
        role: 'assistant',
        content: '', // 빈 content
        tool_calls: toolCalls,
      });

      // 도구 실행 결과들을 메시지에 추가
      for (const toolCall of toolCalls) {
        if (toolCall.type === 'function') {
          followUpMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: `Tool ${toolCall.function.name} executed successfully.`,
          });
        }
      }

      // 명시적으로 사용자 질문에 대한 답변 요청
      followUpMessages.push({
        role: 'user',
        content:
          '위 정보를 바탕으로 제 질문에 대한 구체적이고 유용한 답변을 해주세요.',
      });

      console.log('🔄 Making follow-up request for actual response...');

      try {
        const followUpResponse = await this.openai.chat.completions.create({
          model: options?.model || 'gpt-4o',
          messages: followUpMessages,
          max_tokens: options?.maxTokens || 2000,
          temperature: options?.temperature || 0.7,
          // 두 번째 요청에서는 도구 사용하지 않음
        });

        const followUpChoice = followUpResponse.choices[0];
        if (followUpChoice.message.content) {
          finalResponse = followUpChoice.message.content;
          console.log(
            '✅ Got follow-up response:',
            finalResponse.length,
            'characters',
          );
        } else {
          finalResponse = '요청을 처리했습니다.';
          console.log('⚠️ Follow-up request also failed. Using fallback.');
        }
      } catch (error) {
        console.error('❌ Follow-up request failed:', error);
        finalResponse = '요청을 처리했습니다.';
      }
    }

    // 이제 toolCalls는 반환하지 않음 - 이미 실행했으므로
    // Jarvis는 최종 텍스트 응답만 받아서 DB에 저장하면 됨
    return {
      raw: response,
      response: finalResponse,
      provider: this.modelName,
      // toolCalls 제거 - Provider에서 이미 실행 완료
    };
  }

  getModelName(): string {
    return this.modelName;
  }

  getProviderName(): string {
    return this.providerName;
  }
}
