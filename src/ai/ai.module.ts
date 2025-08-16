import { Module } from '@nestjs/common';
import { GptProvider } from './providers/gpt.provider';
import { ClaudeProvider } from './providers/claude.provider';
import { AiService } from './ai.service';
import { MasterAIProvider } from './master-ai.provider';
import { MasterAIHelper } from './helpers/master-ai.helper';

@Module({
  providers: [
    GptProvider,
    ClaudeProvider,
    AiService,
    MasterAIProvider,
    MasterAIHelper,
  ],
  exports: [
    GptProvider,
    ClaudeProvider,
    MasterAIProvider,
    AiService,
    MasterAIHelper,
  ],
})
export class AIModule {}
