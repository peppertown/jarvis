import { Injectable } from '@nestjs/common';
import { ChatOptions } from './ai.interface';
import { JarvisHelper } from './helpers/jarvis.helper';
import { JarvisRepository } from './ai.repository';
import { pickModelAndTokens } from './utils/jarvis.util';
@Injectable()
export class Jarvis {
  constructor(
    private helper: JarvisHelper,
    private repo: JarvisRepository,
  ) {}

  // 타입 수정 필요
  async chat(message: string, options?: ChatOptions): Promise<any> {
    const userId = options?.userId || 1; // 기본값으로 1 사용
    const sessionId = options?.sessionId || 1; // 기본값으로 1 사용

    await this.repo.createMessage({
      sessionId: sessionId,
      userId: userId,
      role: 'user',
      content: message,
    });
    const category = await this.helper.analyzeQuery(message);

    const selectedProvider = this.helper.selectBestAI(category.task);

    const started = performance.now();
    const { raw, response, provider } = await selectedProvider.chat(
      message,
      options,
    );

    const latencyMs = Math.round(performance.now() - started);

    const { model, tokensIn, tokensOut } = pickModelAndTokens(raw);

    await this.repo.createMessage({
      sessionId: sessionId,
      userId: null,
      role: 'assistant',
      content: response,
      task: category.task,
      topics: category.topics,
      insight: category.insight || null,
      model: model ?? null,
      tokensIn: tokensIn ?? null,
      tokensOut: tokensOut ?? null,
      latencyMs,
    });

    return { response, provider };
  }
}
