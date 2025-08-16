import { Global, Module } from '@nestjs/common';
import { GptProvider } from './providers/gpt.provider';
import { ClaudeProvider } from './providers/claude.provider';
import { Jarvis } from './jarvis';
import { JarvisHelper } from './helpers/jarvis.helper';

@Global()
@Module({
  providers: [GptProvider, ClaudeProvider, Jarvis, JarvisHelper],
  exports: [GptProvider, ClaudeProvider, Jarvis, JarvisHelper],
})
export class AIModule {}
