// apps/api/src/modules/emotion/emotion.controller.ts
import { Controller, Post, Get, Body, Param, Query, Logger } from '@nestjs/common';
import { EmotionService } from './emotion.service';

@Controller('emotion')
export class EmotionController {
  private readonly logger = new Logger(EmotionController.name);

  constructor(private readonly emotionService: EmotionService) {}

  @Post('record')
  async recordEmotion(
    @Body() body: {
      sessionId: string;
      textContent: string;
      source?: 'TEXT' | 'VOICE' | 'FACE';
      poiId?: string;
    },
  ) {
    this.logger.log(`Recording emotion for session ${body.sessionId}`);
    return this.emotionService.recordEmotion({
      sessionId: body.sessionId,
      textContent: body.textContent,
      source: body.source || 'TEXT',
      poiId: body.poiId,
    });
  }

  @Get('session/:id')
  async getSessionEmotions(@Param('id') sessionId: string) {
    return this.emotionService.getSessionEmotions(sessionId);
  }

  @Get('distribution')
  async getDistribution(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.emotionService.getEmotionDistribution(from, to);
  }
}
