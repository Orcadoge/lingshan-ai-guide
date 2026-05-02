import { Body, Controller, Post, UsePipes } from '@nestjs/common';
import { createFeedback } from '@handan/data';
import type { FeedbackInput } from '@handan/shared';
import { feedbackSchema } from '@handan/shared';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('feedback')
export class FeedbackController {
  @Post()
  @UsePipes(new ZodValidationPipe(feedbackSchema))
  async submitFeedback(@Body() input: FeedbackInput) {
    return createFeedback(input);
  }
}
