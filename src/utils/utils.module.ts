import { Module } from '@nestjs/common';
import { OpenAIService } from './openai';

@Module({
  providers: [OpenAIService],
  exports: [OpenAIService],
})
export class UtilsModule {}
