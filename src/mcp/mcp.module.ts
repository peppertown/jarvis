import { Module } from '@nestjs/common';
import { InsightTool } from './tools/insight.tool';
import { ChatModule } from '../modules/chat/chat.module';

@Module({
  imports: [ChatModule],
  providers: [InsightTool],
  exports: [InsightTool],
})
export class McpToolsModule {}
