import { Injectable } from '@nestjs/common';
import { Jarvis } from 'src/ai/jarvis';

@Injectable()
export class ChatService {
  constructor(private jarvis: Jarvis) {}

  async chat(text: string) {
    return await this.jarvis.chat(text);
  }
}
