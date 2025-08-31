import { Global, Module } from '@nestjs/common';
import { GptProvider } from './providers/gpt.provider';
import { ClaudeProvider } from './providers/claude.provider';
import { Jarvis } from './jarvis';
import { JarvisHelper } from './helpers/jarvis.helper';
import { DeepSeekProvider } from './providers/deepseek.provider';
import { ChatModule } from '../modules/chat/chat.module';

@Global()
@Module({
  imports: [ChatModule],
  providers: [
    GptProvider,
    ClaudeProvider,
    Jarvis,
    JarvisHelper,
    DeepSeekProvider,
  ],
  exports: [
    GptProvider,
    ClaudeProvider,
    Jarvis,
    JarvisHelper,
    DeepSeekProvider,
  ],
})
export class AIModule {}
