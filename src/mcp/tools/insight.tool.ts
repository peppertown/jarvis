import { Injectable } from '@nestjs/common';
import { Tool, Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { ChatRepository } from '../../modules/chat/chat.repository';

@Injectable()
export class InsightTool {
  constructor(private chatRepo: ChatRepository) {}

  @Tool({
    name: 'save-insight',
    description:
      '사용자에 대한 중요한 인사이트를 저장합니다. 사용자의 선호도(좋아함/싫어함), 목표/계획, 기술 수준, 제약사항(시간/예산/기기), 습관/루틴 등 지속적이고 실행 가능한 사실만 저장하세요. 단순한 감정이나 일시적 사건은 저장하지 마세요.',
    parameters: z.object({
      sessionId: z.number().describe('현재 채팅 세션 ID'),
      insight: z
        .string()
        .describe(
          '사용자 인사이트 (한 문장으로 간결하게, 한국어 입력 시 한국어로)',
        ),
    }),
  })
  async saveInsight(
    { sessionId, insight }: { sessionId: number; insight: string },
    context?: Context,
  ) {
    try {
      // 새 UserInsight 테이블에 저장
      await this.chatRepo.createUserInsight({
        sessionId,
        insight,
      });

      return {
        success: true,
        message: '인사이트가 저장되었습니다',
        insight,
      };
    } catch (error) {
      return {
        success: false,
        message: `저장 실패: ${error.message}`,
      };
    }
  }

  @Tool({
    name: 'categorize-topics',
    description:
      '대화 주제를 분류하여 저장합니다. 의미있는 주제 변화가 있을 때만 사용하세요. 다음 카테고리만 사용: sports, finance, tech, travel, cooking, health, entertainment, education, law, career, productivity, gaming, personal, other',
    parameters: z.object({
      sessionId: z.number().describe('현재 채팅 세션 ID'),
      topics: z
        .array(
          z.enum([
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
          ]),
        )
        .describe('대화 주제 배열'),
    }),
  })
  async categorizeTopics(
    { sessionId, topics }: { sessionId: number; topics: string[] },
    context?: Context,
  ) {
    try {
      // 새 UserInsight 테이블에 저장 (주제만)
      await this.chatRepo.createUserInsight({
        sessionId,
        topics,
      });

      return {
        success: true,
        message: '주제가 분류되었습니다',
        topics,
      };
    } catch (error) {
      return {
        success: false,
        message: `분류 실패: ${error.message}`,
      };
    }
  }
}
