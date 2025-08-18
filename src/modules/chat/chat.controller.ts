import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../../common/decorators/current-user-id.decorator';
import { CreateSessionDto } from './dto/create-session.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async chat(@Body('text') text: string, @CurrentUserId() userId: number) {
    return await this.chatService.chat(text, userId);
  }

  @Post('sessions')
  @UseGuards(JwtAuthGuard)
  async createSession(
    @Body() createSessionDto: CreateSessionDto,
    @CurrentUserId() userId: number,
  ) {
    return await this.chatService.createSession(userId, createSessionDto);
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  async getSessions(@CurrentUserId() userId: number) {
    return await this.chatService.getSessions(userId);
  }
}
