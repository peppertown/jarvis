import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AIProvider, AIResponse, ChatOptions } from '../ai.interface';

@Injectable()
export class GptProvider implements AIProvider {
  private openai: OpenAI;
  private modelName = 'gpt-5-mini';
  private providerName = 'OpenAI';

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('ai.openai.apiKey'),
    });
  }

  async chat(message: string, options?: ChatOptions): Promise<AIResponse> {
    // 🏗️ OpenAI API 메시지 구조 구성
    const messages: any[] = [];

    // 시스템 메시지 추가 (AI 역할 및 지침)
    if (options?.systemMessage) {
      messages.push({ role: 'system', content: options.systemMessage });
    }

    // 대화 히스토리 추가 - 맥락 유지를 위해 필요
    if (
      options?.conversationHistory &&
      options.conversationHistory.length > 0
    ) {
      // 시스템 메시지 이후에는 user/assistant 메시지만 추가
      const chatMessages = options.conversationHistory.filter(
        (msg) => msg.role === 'user' || msg.role === 'assistant',
      );
      messages.push(...chatMessages);
    }

    // 현재 사용자 질문 추가
    messages.push({ role: 'user', content: message });

    // 🎯 MCP 도구 설정 (Jarvis에서 전달받음)
    // options.tools가 있으면 Function Calling 사용, 없으면 순수 텍스트 응답
    const apiParams: any = {
      model: options?.model || this.modelName,
      messages,
      max_completion_tokens: options?.maxTokens || 2000,
      temperature: 1,
    };

    // Jarvis에서 도구 목록을 전달한 경우에만 Function Calling 활성화
    if (options?.tools && options.tools.length > 0) {
      apiParams.tools = options.tools;
      apiParams.tool_choice = 'auto';
      console.log(
        '🔧 Function Calling enabled with',
        options.tools.length,
        'tools',
      );
    }

    console.log('💬 Sending', messages.length, 'messages to OpenAI');

    // 🚀 순수한 OpenAI API 호출 - MCP 로직 없이 단순한 래퍼 역할
    const response = await this.openai.chat.completions.create(apiParams);

    const choice = response.choices[0];

    // 📊 응답 분석 로깅
    console.log('🤖 OpenAI Response Analysis:');
    console.log('  - Finish reason:', choice.finish_reason);
    console.log('  - Has content:', choice.message.content ? 'Yes' : 'No');
    console.log(
      '  - Tool calls count:',
      choice.message.tool_calls?.length || 0,
    );

    // 🔍 OpenAI 응답 구조 해석
    // choice.message.content: AI의 텍스트 응답 (도구만 호출 시 null 가능)
    // choice.message.tool_calls: AI가 호출하려는 도구들의 배열
    // finish_reason: 'stop'(완료) | 'tool_calls'(도구 호출 필요) | 'length'(토큰 한계)

    const textResponse = choice.message.content || '';
    const rawToolCalls = choice.message.tool_calls || [];

    // 🔄 도구 호출 정보를 표준 형식으로 변환
    // Provider는 도구를 실행하지 않고, 정보만 Jarvis에게 전달
    const toolCalls = rawToolCalls
      .filter((tc) => tc.type === 'function')
      .map((tc) => {
        try {
          return {
            name: tc.function.name,
            parameters: JSON.parse(tc.function.arguments),
          };
        } catch (error) {
          console.error(
            '❌ Failed to parse tool arguments:',
            error,
            tc.function.arguments,
          );
          return null;
        }
      })
      .filter(Boolean); // null 값 제거

    if (toolCalls.length > 0) {
      console.log(
        '📤 Returning tool calls to Jarvis:',
        toolCalls.map((tc) => tc.name),
      );
    }

    // ✨ Provider의 핵심 역할: 순수한 API 응답을 Jarvis에게 전달
    // - 도구 실행은 Jarvis가 담당
    // - Follow-up 로직도 Jarvis가 담당
    // - Provider는 단순한 API 래퍼 역할에 집중

    // 🎯 표준화된 AIResponse 반환 - Jarvis가 오케스트레이션할 수 있도록
    return {
      raw: response, // 원본 OpenAI 응답 (디버깅용)
      response: textResponse, // AI의 텍스트 응답 (빈 문자열 가능)
      provider: this.modelName, // 사용된 모델명
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined, // 도구 호출 정보
    };
  }

  getModelName(): string {
    return this.modelName;
  }

  getProviderName(): string {
    return this.providerName;
  }
}
