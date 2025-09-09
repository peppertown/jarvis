import { Injectable } from '@nestjs/common';
import { Tool, Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InsightTool {
  constructor(private prisma: PrismaService) {}
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
      messageId,
      category,
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
      console.log(`💡 [MCP-INSIGHT] Saving insight to database...`);
      console.log(`   사용자ID: ${userId}, 세션ID: ${sessionId}`);
      console.log(`   인사이트: ${insight}`);

      // 🗄️ 실제 데이터베이스에 저장 (중복 방지 포함)
      const savedInsight = await this.prisma.insight.upsert({
        where: {
          userId_content: {
            userId: userId,
            content: insight,
          },
        },
        update: {
          // 이미 존재하면 세션/메시지 정보만 업데이트
          sessionId: sessionId,
          messageId: messageId,
        },
        create: {
          userId: userId,
          sessionId: sessionId,
          messageId: messageId,
          content: insight,
          category: category,
          source: 'MCP-Tool',
        },
      });

      console.log(`✅ [MCP-INSIGHT] Saved with ID: ${savedInsight.id}`);

      return {
        success: true,
        message: `인사이트가 데이터베이스에 저장되었습니다: ${insight}`,
        insightId: savedInsight.id,
      };
    } catch (error) {
      console.error(`❌ [MCP-INSIGHT] Database save failed:`, error);
      return {
        success: false,
        message: `인사이트 저장 실패: ${error.message}`,
      };
    }
  }
}
