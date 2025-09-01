import { Injectable } from '@nestjs/common';
import { InsightTool } from './tools/insight.tool';

@Injectable()
export class McpService {
  constructor(private insightTool: InsightTool) {}

  // MCP 도구들을 OpenAI/Anthropic 호환 형식으로 변환
  getToolDefinitions() {
    return [
      {
        type: 'function',
        function: {
          name: 'save-insight',
          description:
            '사용자에 대한 중요한 인사이트를 저장합니다. 사용자의 선호도, 목표/계획, 기술 수준, 제약사항, 습관/루틴 등 지속적이고 실행 가능한 사실만 저장하세요.',
          parameters: {
            type: 'object',
            properties: {
              sessionId: {
                type: 'number',
                description: '현재 채팅 세션 ID',
              },
              insight: {
                type: 'string',
                description:
                  '사용자 인사이트 (한 문장으로 간결하게, 한국어 입력 시 한국어로)',
              },
            },
            required: ['sessionId', 'insight'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'categorize-topics',
          description:
            '대화의 주제를 분류하고 저장합니다. 여러 토픽이 있을 경우 모두 포함하세요.',
          parameters: {
            type: 'object',
            properties: {
              sessionId: {
                type: 'number',
                description: '현재 채팅 세션 ID',
              },
              topics: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: [
                    'sports',
                    'finance',
                    'tech',
                    'travel',
                    'cooking',
                    'health',
                    'entertainment',
                    'education',
                    'law',
                    'career',
                    'productivity',
                    'gaming',
                    'personal',
                    'other',
                  ],
                },
                description: '대화 주제 분류',
              },
              category: {
                type: 'string',
                description: '대화의 전반적인 카테고리 (선택사항)',
              },
            },
            required: ['sessionId', 'topics'],
          },
        },
      },
    ];
  }

  // 도구 호출 실행
  async executeTool(toolName: string, parameters: any) {
    switch (toolName) {
      case 'save-insight':
        return await this.insightTool.saveInsight(parameters, null);
      case 'categorize-topics':
        return await this.insightTool.categorizeTopics(parameters, null);
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }
}
