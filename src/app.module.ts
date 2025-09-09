import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { McpModule } from '@rekog/mcp-nest';
import { AIModule } from './ai/ai.module';
import { ChatModule } from './modules/chat/chat.module';
import { AuthModule } from './modules/auth/auth.module';
import { PersonaModule } from './modules/persona/persona.module';
import { PrismaModule } from './prisma/prisma.module';
import { McpToolsModule } from './mcp/mcp.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    McpModule.forRoot({
      name: 'jarvis-server',
      version: '1.0.0',
    }),
    PrismaModule,
    ChatModule,
    AuthModule,
    PersonaModule,
    McpToolsModule,
    AIModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
