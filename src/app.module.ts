import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { McpModule } from '@rekog/mcp-nest';
import { AIModule } from './ai/ai.module';
import { ChatModule } from './modules/chat/chat.module';

@Module({
  imports: [
    McpModule.forRoot({
      name: 'jarvis-server',
      version: '1.0.0',
    }),
    AIModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
