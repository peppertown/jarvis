import { Module } from '@nestjs/common';
import { GptProvider } from './providers/gpt.provider';
import { ClaudeProvider } from './providers/claude.provider';

@Module({
  providers: [GptProvider, ClaudeProvider],
  exports: [GptProvider, ClaudeProvider],
})
export class AIModule {}
