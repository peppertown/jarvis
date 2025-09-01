import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { AIProvider, AIResponse, ChatOptions } from '../ai.interface';
import { McpService } from '../../mcp/mcp.service';

@Injectable()
export class ClaudeProvider implements AIProvider {
  private anthropic: Anthropic;
  private modelName = 'claude-3-sonnet';
  private providerName = 'Anthropic';

  constructor(
    private configService: ConfigService,
    private mcpService: McpService,
  ) {
    this.anthropic = new Anthropic({
      apiKey: this.configService.get<string>('ai.anthropic.apiKey'),
    });
  }

  async chat(message: string, options?: ChatOptions): Promise<AIResponse> {
    console.log(`   🟣 [CLAUDE] API 호출 준비`);
    const messages: any[] = [];

    // 대화 히스토리 추가 (있으면)
    if (
      options?.conversationHistory &&
      options.conversationHistory.length > 0
    ) {
      // 시스템 메시지는 제외하고 user/assistant 메시지만 추가
      const chatMessages = options.conversationHistory.filter(
        (msg) => msg.role === 'user' || msg.role === 'assistant',
      );
      messages.push(...chatMessages);
    }

    // 현재 사용자 메시지 추가
    messages.push({ role: 'user', content: message });

    // MCP 도구 정의 가져오기
    const tools = options?.tools || this.mcpService.getToolDefinitions();
    console.log(`   📋 [CLAUDE] MCP 도구 수: ${tools.length}개`);
    const anthropicTools = tools.map((tool) => ({
      name: tool.function.name,
      description: tool.function.description,
      input_schema: tool.function.parameters,
    }));

    const response = await this.anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: options?.maxTokens || 1000,
      messages,
      system: options?.systemMessage,
      tools: anthropicTools.length > 0 ? anthropicTools : undefined,
    });

    const toolCalls: any[] = [];
    let responseText = '';

    // 응답 처리
    for (const content of response.content) {
      if (content.type === 'text') {
        responseText += content.text;
      } else if (content.type === 'tool_use') {
        toolCalls.push({
          name: content.name,
          parameters: content.input,
        });
      }
    }

    console.log(`   🟣 [CLAUDE] 응답 완료 - 도구 호출: ${toolCalls.length}개`);
    if (toolCalls.length > 0) {
      toolCalls.forEach((tc) => {
        console.log(`        → ${tc.name}:`, tc.parameters);
      });
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
