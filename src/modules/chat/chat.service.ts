import { Injectable } from '@nestjs/common';
import { Jarvis } from 'src/ai/jarvis';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';

@Injectable()
export class ChatService {
  constructor(
    private jarvis: Jarvis,
    private prisma: PrismaService,
  ) {}

  async chat(text: string, userId: number) {
    return await this.jarvis.chat(text, { userId });
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
}
