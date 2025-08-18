import { Body, Controller, Post, UseGuards, Request } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async chat(@Body('text') text: string, @Request() req) {
    const userId = req.user.id;
    return await this.chatService.chat(text, userId);
  }
}
