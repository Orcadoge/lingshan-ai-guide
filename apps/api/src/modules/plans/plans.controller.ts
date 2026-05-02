import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UsePipes,
} from '@nestjs/common';
import { getPlanSessionByShareId } from '@handan/data';
import type { GeneratePlanRequest, RefinePlanRequest } from '@handan/shared';
import {
  generatePlanRequestSchema,
  refinePlanRequestSchema,
} from '@handan/shared';
import type { Response } from 'express';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { PlansService } from './plans.service';

@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Post('generate')
  @UsePipes(new ZodValidationPipe(generatePlanRequestSchema))
  async generate(@Body() body: GeneratePlanRequest): Promise<unknown> {
    return this.plansService.generate(body);
  }

  @Post('generate-stream')
  @UsePipes(new ZodValidationPipe(generatePlanRequestSchema))
  async generateStream(
    @Body() body: GeneratePlanRequest,
    @Res() response: Response,
  ) {
    response.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    response.setHeader('Cache-Control', 'no-cache, no-transform');
    response.setHeader('Connection', 'keep-alive');
    response.setHeader('X-Accel-Buffering', 'no');
    response.flushHeaders?.();

    const writeEvent = (type: string, payload: unknown) => {
      response.write(`event: ${type}\n`);
      response.write(`data: ${JSON.stringify(payload)}\n\n`);
    };
    const waitingMessages = [
      '正在让路线更像真人导游写的版本...',
      '正在检查顺路程度、吃饭时间和步行压力...',
      '正在补充每一段为什么值得去。',
    ];
    let waitingIndex = 0;
    const waitingTimer = setInterval(() => {
      writeEvent('progress', {
        stage: 'ai-polish',
        message: waitingMessages[waitingIndex % waitingMessages.length],
      });
      waitingIndex += 1;
    }, 3500);

    try {
      const result = await this.plansService.generate(body, {
        onProgress: (event) => writeEvent('progress', event),
      });

      writeEvent('done', result);
    } catch (error) {
      writeEvent('error', {
        message:
          error instanceof Error ? error.message : '生成路线失败，请稍后再试。',
      });
    } finally {
      clearInterval(waitingTimer);
      response.end();
    }
  }

  @Post('refine')
  @UsePipes(new ZodValidationPipe(refinePlanRequestSchema))
  async refine(@Body() body: RefinePlanRequest): Promise<unknown> {
    return this.plansService.refine(body);
  }

  @Get('share/:shareId')
  async getSharedPlan(@Param('shareId') shareId: string): Promise<unknown> {
    const session = await getPlanSessionByShareId(shareId);
    return session.resultPayload;
  }
}
