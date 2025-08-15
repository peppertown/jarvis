import { Module } from '@nestjs/common';
import { GptProvider } from './providers/gpt.provider';
import { ClaudeProvider } from './providers/claude.provider';
import { AiService } from './ai.service';
import { MasterAIProvider } from './providers/master-ai.provider';

@Module({
  providers: [GptProvider, ClaudeProvider, AiService, MasterAIProvider],
  exports: [GptProvider, ClaudeProvider, MasterAIProvider, AiService],
})
export class AIModule {}
