import { Injectable } from '@nestjs/common';
import { InsightTool } from './tools/insight.tool';

@Injectable()
export class McpService {
  constructor(private insightTool: InsightTool) {}

  // MCP 도구를 OpenAI Function Calling 형식으로 변환
  getToolsForOpenAI() {
    return [
      {
        type: 'function' as const,
        function: {
          name: 'save-insight',
          description:
            '사용자에 대한 중요한 정보를 저장합니다 (선호도, 기술수준, 목표 등)',
          parameters: {
            type: 'object',
            properties: {
              insight: {
                type: 'string',
                description: '저장할 인사이트 내용',
              },
              sessionId: {
                type: 'number',
                description: '현재 세션 ID',
              },
            },
            required: ['insight', 'sessionId'],
          },
        },
      },
    ];
  }

  // MCP 도구를 Claude 형식으로 변환
  getToolsForClaude() {
    return [
      {
        name: 'save-insight',
        description:
          '사용자에 대한 중요한 정보를 저장합니다 (선호도, 기술수준, 목표 등)',
        input_schema: {
          type: 'object' as const,
          properties: {
            insight: {
              type: 'string' as const,
              description: '저장할 인사이트 내용',
            },
            sessionId: {
              type: 'number' as const,
              description: '현재 세션 ID',
            },
          },
          required: ['insight', 'sessionId'],
        },
      },
    ];
  }

  // 도구 호출 실행
  async executeTool(toolName: string, parameters: any) {
    switch (toolName) {
      case 'save-insight':
        return await this.insightTool.saveInsight(parameters);
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }
}
