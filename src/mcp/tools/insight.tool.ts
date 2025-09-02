import { Injectable } from '@nestjs/common';
import { Tool, Context } from '@rekog/mcp-nest';
import { z } from 'zod';

@Injectable()
export class InsightTool {
  @Tool({
    name: 'save-insight',
    description:
      '사용자에 대한 중요한 정보를 저장합니다 (선호도, 기술수준, 목표 등)',
    parameters: z.object({
      insight: z.string().describe('저장할 인사이트 내용'),
      sessionId: z.number().describe('현재 세션 ID'),
    }),
  })
  async saveInsight(
    { insight, sessionId }: { insight: string; sessionId: number },
    context?: Context,
  ) {
    try {
      const timestamp = new Date().toISOString();

      // 일단 콘솔에만 출력 (나중에 DB 저장으로 바꿀 예정)
      console.log(`💡 [MCP-INSIGHT] ${timestamp}`);
      console.log(`   세션ID: ${sessionId}`);
      console.log(`   인사이트: ${insight}`);

      return {
        success: true,
        message: `인사이트가 저장되었습니다: ${insight}`,
        timestamp,
      };
    } catch (error) {
      return {
        success: false,
        message: `인사이트 저장 실패: ${error.message}`,
      };
    }
  }
}
