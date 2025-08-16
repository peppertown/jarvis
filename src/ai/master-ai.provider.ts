import { Injectable } from '@nestjs/common';
import { AIResponse, ChatOptions } from './ai.interface';
import { MasterAIHelper } from './helpers/master-ai.helper';
@Injectable()
export class MasterAIProvider {
  constructor(private helper: MasterAIHelper) {}

  async chat(message: string, options?: ChatOptions): Promise<AIResponse> {
    const category = await this.helper.analyzeQuery(message);

    const selectedProvider = this.helper.selectBestAI(category);

    const { response, provider } = await selectedProvider.chat(
      message,
      options,
    );

    return { response, provider };
  }
}
