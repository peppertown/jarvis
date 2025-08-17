import { Injectable } from '@nestjs/common';
import { AIResponse, ChatOptions } from './ai.interface';
import { JarvisHelper } from './helpers/jarvis.helper';
@Injectable()
export class Jarvis {
  constructor(private helper: JarvisHelper) {}

  async chat(message: string, options?: ChatOptions): Promise<AIResponse> {
    const category = await this.helper.analyzeQuery(message);

    const selectedProvider = this.helper.selectBestAI(category.task);

    const { response, provider } = await selectedProvider.chat(
      message,
      options,
    );

    return { response, provider };
  }
}
