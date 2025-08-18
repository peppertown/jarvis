import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { McpModule } from '@rekog/mcp-nest';
import { AIModule } from './ai/ai.module';
import { ChatModule } from './modules/chat/chat.module';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    McpModule.forRoot({
      name: 'jarvis-server',
      version: '1.0.0',
    }),
    AIModule,
    ChatModule,
    AuthModule,
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
