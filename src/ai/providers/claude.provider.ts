import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { AIProvider, AIResponse, ChatOptions } from '../ai.interface';

@Injectable()
export class ClaudeProvider implements AIProvider {
  private anthropic: Anthropic;
  private modelName = 'claude-3-sonnet';
  private providerName = 'Anthropic';

  constructor(private configService: ConfigService) {
    this.anthropic = new Anthropic({
      apiKey: this.configService.get<string>('ai.anthropic.apiKey'),
    });
  }

  async chat(message: string, options?: ChatOptions): Promise<AIResponse> {
    // 🏗️ Claude API 메시지 구조 구성
    const messages: any[] = [];

    // 대화 히스토리 추가 - 맥락 유지를 위해 필요
    if (
      options?.conversationHistory &&
      options.conversationHistory.length > 0
    ) {
      // Claude는 시스템 메시지를 별도 파라미터로 처리하므로 user/assistant만 추가
      const chatMessages = options.conversationHistory
        .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
        .filter((msg) => msg.content && msg.content.trim().length > 0); // 빈 메시지 필터링
      messages.push(...chatMessages);
    }

    // 현재 사용자 질문 추가
    messages.push({ role: 'user', content: message });

    // 🎯 MCP 도구 설정 (Jarvis에서 전달받음)
    // options.tools가 있으면 Claude Tools 사용, 없으면 순수 텍스트 응답
    const apiParams: any = {
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: options?.maxTokens || 2000,
      messages,
      system: options?.systemMessage,
    };

    // Jarvis에서 도구 목록을 전달한 경우에만 Tools 활성화
    if (options?.tools && options.tools.length > 0) {
      apiParams.tools = options.tools;
      console.log(
        '🔧 Claude Tools enabled with',
        options.tools.length,
        'tools',
      );
    }

    console.log('💬 Sending', messages.length, 'messages to Claude');

    // 🚀 순수한 Claude API 호출 - MCP 로직 없이 단순한 래퍼 역할
    const response = await this.anthropic.messages.create(apiParams);

    // 📊 응답 분석 로깅
    console.log('🤖 Claude Response Analysis:');
    console.log('  - Content blocks:', response.content.length);

    // 🔍 Claude 응답 구조 해석
    // response.content: 배열로 구성된 응답 블록들
    // - type: 'text' (텍스트 응답) | 'tool_use' (도구 사용)
    // - 여러 블록이 있을 수 있음 (텍스트 + 도구 조합 가능)

    let textResponse = '';
    const rawToolCalls = [];

    // 응답 블록들을 순회하며 텍스트와 도구 호출 분리
    for (const content of response.content) {
      if (content.type === 'text') {
        textResponse += content.text;
        console.log('  - Text block found:', content.text.length, 'chars');
      } else if (content.type === 'tool_use') {
        rawToolCalls.push(content);
        console.log('  - Tool use found:', content.name);
      }
    }

    // 🔄 도구 호출 정보를 표준 형식으로 변환
    // Provider는 도구를 실행하지 않고, 정보만 Jarvis에게 전달
    const toolCalls = rawToolCalls.map((tc) => ({
      name: tc.name,
      parameters: tc.input, // Claude는 input 필드 사용
    }));

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
      raw: response, // 원본 Claude 응답 (디버깅용)
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
