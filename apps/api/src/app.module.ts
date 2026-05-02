import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AdminController } from './modules/admin/admin.controller';
import { FeedbackController } from './modules/feedback/feedback.controller';
import { FoodsController } from './modules/foods/foods.controller';
import { HealthController } from './modules/health/health.controller';
import { PlansController } from './modules/plans/plans.controller';
import { PoisController } from './modules/pois/pois.controller';
import { SearchController } from './modules/search/search.controller';
import { ThemesController } from './modules/themes/themes.controller';
import { VoiceController } from './modules/voice/voice.controller';
import { DigitalHumanController, DigitalHumanAdminController } from './modules/digital-human/digital-human.controller';
import { DigitalHumanService } from './modules/digital-human/digital-human.service';
import { DidClientService } from './modules/digital-human/did-client.service';
import { EmotionController } from './modules/emotion/emotion.controller';
import { EmotionService } from './modules/emotion/emotion.service';
import { TextSentimentService } from './modules/emotion/text-sentiment.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
  ],
  controllers: [
    AdminController,
    FeedbackController,
    FoodsController,
    HealthController,
    PlansController,
    PoisController,
    SearchController,
    ThemesController,
    VoiceController,
    DigitalHumanController,
    DigitalHumanAdminController,
    EmotionController,
  ],
  providers: [
    DigitalHumanService,
    DidClientService,
    EmotionService,
    TextSentimentService,
  ],
})
export class AppModule {}
