// apps/api/src/modules/emotion/emotion.module.ts
import { Module } from '@nestjs/common';
import { EmotionController } from './emotion.controller';
import { EmotionService } from './emotion.service';
import { TextSentimentService } from './text-sentiment.service';

@Module({
  controllers: [EmotionController],
  providers: [EmotionService, TextSentimentService],
  exports: [EmotionService],
})
export class EmotionModule {}
