import { Body, Controller, Post } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async chat(@Body('text') text: string) {
    return await this.chatService.chat(text);
  }
}
