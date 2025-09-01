import { Module } from '@nestjs/common';
import { InsightTool } from './tools/insight.tool';
import { McpService } from './mcp.service';
import { ChatModule } from '../modules/chat/chat.module';

@Module({
  imports: [ChatModule],
  providers: [InsightTool, McpService],
  exports: [InsightTool, McpService],
})
export class McpToolsModule {}
