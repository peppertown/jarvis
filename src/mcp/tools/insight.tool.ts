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
      userId: z.number().describe('사용자 ID'),
      messageId: z.number().optional().describe('메시지 ID (선택)'),
      category: z.string().optional().describe('인사이트 카테고리'),
    }),
  })
  async saveInsight(
    {
      insight,
      sessionId,
      userId,
    }: {
      insight: string;
      sessionId: number;
      userId: number;
      messageId?: number;
      category?: string;
    },
    context?: Context,
  ) {
    try {
      console.log(`💡 [MCP-INSIGHT] Insight received (not saving to DB)`);
      console.log(`   사용자ID: ${userId}, 세션ID: ${sessionId}`);
      console.log(`   인사이트: ${insight}`);

      // 🚫 DB 저장 로직 제거 - JarvisHelper에서만 저장하도록 함
      // MCP 도구는 인사이트 수집 목적으로만 사용

      return {
        success: true,
        message: `인사이트를 확인했습니다: ${insight}`,
      };
    } catch (error) {
      console.error(`❌ [MCP-INSIGHT] Error:`, error);
      return {
        success: false,
        message: `인사이트 처리 실패: ${error.message}`,
      };
    }
  }
}
