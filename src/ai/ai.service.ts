import { Injectable } from '@nestjs/common';
import { MasterAIProvider } from './providers/master-ai.provider';

@Injectable()
export class AiService {
  constructor(private ai: MasterAIProvider) {}

  async chat(message: string) {
    return await this.ai.chat(message);
  }
}
