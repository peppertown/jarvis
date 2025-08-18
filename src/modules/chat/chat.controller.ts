import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../../common/decorators/current-user-id.decorator';
import { CreateSessionDto } from './dto/create-session.dto';
import { ChatDto } from './dto/chat.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async chat(@Body() chatDto: ChatDto, @CurrentUserId() userId: number) {
    return await this.chatService.chat(chatDto, userId);
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

  @Delete('sessions/:id')
  @UseGuards(JwtAuthGuard)
  async deleteSession(
    @Param('id') sessionId: string,
    @CurrentUserId() userId: number,
  ) {
    return await this.chatService.deleteSession(+sessionId, userId);
  }
}
