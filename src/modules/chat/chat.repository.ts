import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMessageDTO } from './dto/create-message.dto';
import { CreateSessionDto } from './dto/create-session.dto';

@Injectable()
export class ChatRepository {
  constructor(private db: PrismaService) {}

  // 세션 관련 메서드들
  async createSession(userId: number, createSessionDto: CreateSessionDto) {
    return await this.db.session.create({
      data: {
        userId,
        title: createSessionDto.title || '새로운 채팅',
      },
    });
  }

  async getSessions(userId: number) {
    return await this.db.session.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });
  }

  async findSessionById(sessionId: number) {
    return await this.db.session.findUnique({
      where: { id: sessionId },
    });
  }

  async deleteSession(sessionId: number) {
    return await this.db.session.delete({
      where: { id: sessionId },
    });
  }

  // 메시지 관련 메서드들 (JarvisRepository에서 이동)
  async createMessage(createMessageDTO: CreateMessageDTO) {
    return await this.db.message.create({
      data: createMessageDTO,
    });
  }

  async getSessionMessages(sessionId: number) {
    return await this.db.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
        model: true,
        latencyMs: true,
      },
    });
  }

  // AI 제공자용 간단한 대화 히스토리 (role, content만)
  async getConversationHistory(sessionId: number) {
    return await this.db.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      select: {
        role: true,
        content: true,
      },
    });
  }

  // UserInsight 관련 메서드들
  async createUserInsight(data: {
    sessionId: number;
    insight?: string;
    topics?: string[];
    category?: string;
  }) {
    // sessionId로 userId 찾기
    const session = await this.db.session.findUnique({
      where: { id: data.sessionId },
      select: { userId: true },
    });

    if (!session?.userId) {
      throw new Error('유효하지 않은 세션입니다');
    }

    return await this.db.userInsight.create({
      data: {
        userId: session.userId,
        sessionId: data.sessionId,
        insight: data.insight || null,
        topics: data.topics || null,
        category: data.category || null,
      },
    });
  }

  // 사용자별 인사이트 조회
  async getUserInsights(userId: number) {
    return await this.db.userInsight.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // UserProfile 관련 메서드들
  async getUserProfile(userId: number) {
    return await this.db.userProfile.findUnique({
      where: { userId },
    });
  }

  async createOrUpdateUserProfile(userId: number, data: any) {
    return await this.db.userProfile.upsert({
      where: { userId },
      update: {
        ...data,
        lastUpdated: new Date(),
      },
      create: {
        userId,
        ...data,
      },
    });
  }
}
