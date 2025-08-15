import { Module } from '@nestjs/common';
import { GptProvider } from './providers/gpt.provider';

@Module({
  providers: [GptProvider],
  exports: [GptProvider],
})
export class AIModule {}
