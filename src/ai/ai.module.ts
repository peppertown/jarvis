import { Global, Module } from '@nestjs/common';
import { GptProvider } from './providers/gpt.provider';
import { ClaudeProvider } from './providers/claude.provider';
import { Jarvis } from './jarvis';
import { JarvisHelper } from './helpers/jarvis.helper';
import { DeepSeekProvider } from './providers/deepseek.provider';
import { ChatModule } from '../modules/chat/chat.module';
import { McpToolsModule } from '../mcp/mcp.module';
import { PersonaModule } from '../modules/persona/persona.module';

@Global()
@Module({
  imports: [
    ChatModule,
    McpToolsModule, // MCP 도구들을 사용하기 위한 모듈 import
    PersonaModule, // 페르소나 서비스 사용을 위한 모듈 import
  ],
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
