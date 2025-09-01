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
    private mcpService: McpService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('ai.openai.apiKey'),
    });
  }

  async chat(message: string, options?: ChatOptions): Promise<AIResponse> {
    console.log(`   🔵 [GPT] API 호출 준비`);
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

    // MCP 도구 정의 가져오기
    const tools = options?.tools || this.mcpService.getToolDefinitions();
    console.log(`   📋 [GPT] MCP 도구 수: ${tools.length}개`);

    const response = await this.openai.chat.completions.create({
      model: options?.model || 'gpt-4o',
      messages,
      max_tokens: options?.maxTokens || 1000,
      temperature: options?.temperature || 0.7,
      tools: tools.length > 0 ? tools : undefined,
      tool_choice: tools.length > 0 ? 'auto' : undefined,
    });

    const choice = response.choices[0];
    const toolCalls =
      choice.message.tool_calls?.map((tc) => {
        if (tc.type === 'function') {
          return {
            name: tc.function.name,
            parameters: JSON.parse(tc.function.arguments),
          };
        }
        return { name: '', parameters: {} };
      }) || [];

    console.log(`   🔵 [GPT] 응답 완료 - 도구 호출: ${toolCalls.length}개`);
    if (toolCalls.length > 0) {
      toolCalls.forEach((tc) => {
        console.log(`        → ${tc.name}:`, tc.parameters);
      });
    }

    // 도구 호출만 있고 텍스트 응답이 없는 경우 기본 메시지 제공
    let responseText = choice.message.content || '';
    if (!responseText && toolCalls.length > 0) {
      responseText = '네, 정보를 저장했습니다.';
    }

    return {
      raw: response,
      response: responseText,
      provider: this.modelName,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    };
  }

  getModelName(): string {
    return this.modelName;
  }

  getProviderName(): string {
    return this.providerName;
  }
}
