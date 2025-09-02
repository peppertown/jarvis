import { Module } from '@nestjs/common';
import { InsightTool } from './tools/insight.tool';
import { McpService } from './mcp.service';

@Module({
  providers: [InsightTool, McpService],
  exports: [InsightTool, McpService],
})
export class McpToolsModule {}
