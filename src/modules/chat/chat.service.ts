import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Jarvis } from 'src/ai/jarvis';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { ChatDto } from './dto/chat.dto';

@Injectable()
export class ChatService {
  constructor(
    private jarvis: Jarvis,
    private prisma: PrismaService,
  ) {}

  async chat(chatDto: ChatDto, userId: number) {
    // 세션 존재 및 소유권 검증
    const session = await this.prisma.session.findUnique({
      where: { id: chatDto.sessionId },
    });

    if (!session) {
      throw new NotFoundException('세션을 찾을 수 없습니다');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('세션에 접근할 권한이 없습니다');
    }

    // Jarvis에 sessionId도 함께 전달
    return await this.jarvis.chat(chatDto.text, {
      userId,
      sessionId: chatDto.sessionId,
    });
  }

  async createSession(userId: number, createSessionDto: CreateSessionDto) {
    const session = await this.prisma.session.create({
      data: {
        userId,
        title: createSessionDto.title || '새로운 채팅',
      },
    });

    return session;
  }

  async getSessions(userId: number) {
    const sessions = await this.prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });

    return sessions;
  }

  async deleteSession(sessionId: number, userId: number) {
    // 세션 존재 및 권한 체크
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('세션을 찾을 수 없습니다');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('세션을 삭제할 권한이 없습니다');
    }

    // 세션과 관련된 메시지들도 함께 삭제 (CASCADE)
    await this.prisma.session.delete({
      where: { id: sessionId },
    });

    return { message: '세션이 성공적으로 삭제되었습니다' };
  }
}
