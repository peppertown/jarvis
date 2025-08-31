import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Jarvis } from 'src/ai/jarvis';
import { CreateSessionDto } from './dto/create-session.dto';
import { ChatDto } from './dto/chat.dto';
import { ChatRepository } from './chat.repository';

@Injectable()
export class ChatService {
  constructor(
    private jarvis: Jarvis,
    private chatRepo: ChatRepository,
  ) {}

  private async validateSessionAccess(sessionId: number, userId: number) {
    const session = await this.chatRepo.findSessionById(sessionId);

    if (!session) {
      throw new NotFoundException('세션을 찾을 수 없습니다');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('세션에 접근할 권한이 없습니다');
    }

    return session;
  }

  async chat(chatDto: ChatDto, userId: number) {
    // 세션 검증
    await this.validateSessionAccess(chatDto.sessionId, userId);

    // Jarvis에 sessionId도 함께 전달
    return await this.jarvis.chat(chatDto.text, {
      userId,
      sessionId: chatDto.sessionId,
    });
  }

  async createSession(userId: number, createSessionDto: CreateSessionDto) {
    return await this.chatRepo.createSession(userId, createSessionDto);
  }

  async getSessions(userId: number) {
    return await this.chatRepo.getSessions(userId);
  }

  async getSessionMessages(sessionId: number, userId: number) {
    // 세션 검증
    const session = await this.validateSessionAccess(sessionId, userId);

    // 세션의 메시지들 조회
    const messages = await this.chatRepo.getSessionMessages(sessionId);

    return {
      session: {
        id: session.id,
        title: session.title,
        createdAt: session.createdAt,
      },
      messages,
    };
  }

  async deleteSession(sessionId: number, userId: number) {
    // 세션 검증
    await this.validateSessionAccess(sessionId, userId);

    // 세션 삭제 (관련 메시지들도 함께 삭제)
    await this.chatRepo.deleteSession(sessionId);

    return { message: '세션이 성공적으로 삭제되었습니다' };
  }
}
