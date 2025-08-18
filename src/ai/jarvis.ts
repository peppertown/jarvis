import { Injectable } from '@nestjs/common';
import { AIResponse, ChatOptions } from './ai.interface';
import { JarvisHelper } from './helpers/jarvis.helper';
import { JarvisRepository } from './ai.repository';
@Injectable()
export class Jarvis {
  constructor(
    private helper: JarvisHelper,
    private repo: JarvisRepository,
  ) {}

  // 타입 수정 필요
  async chat(message: string, options?: ChatOptions): Promise<any> {
    await this.repo.createMessage({
      sessionId: 1,
      userId: 1,
      role: 'user',
      content: message,
    });
    const category = await this.helper.analyzeQuery(message);

    const selectedProvider = this.helper.selectBestAI(category.task);

    const { raw, response, provider } = await selectedProvider.chat(
      message,
      options,
    );

    return { raw, response, provider };
  }
}
