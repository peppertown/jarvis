import { Global, Module } from '@nestjs/common';
import { GptProvider } from './providers/gpt.provider';
import { ClaudeProvider } from './providers/claude.provider';
import { Jarvis } from './jarvis';
import { JarvisHelper } from './helpers/jarvis.helper';
import { DeepSeekProvider } from './providers/deepseek.provider';
import { JarvisRepository } from './ai.repository';

@Global()
@Module({
  providers: [
    GptProvider,
    ClaudeProvider,
    Jarvis,
    JarvisHelper,
    DeepSeekProvider,
    JarvisRepository,
  ],
  exports: [
    GptProvider,
    ClaudeProvider,
    Jarvis,
    JarvisHelper,
    DeepSeekProvider,
    JarvisRepository,
  ],
})
export class AIModule {}
