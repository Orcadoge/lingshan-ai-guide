import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AdminGuard } from './common/decorators/admin.guard';
import { AdminController } from './modules/admin/admin.controller';
import { FeedbackController } from './modules/feedback/feedback.controller';
import { FoodsController } from './modules/foods/foods.controller';
import { HealthController } from './modules/health/health.controller';
import { PlansController } from './modules/plans/plans.controller';
import { PlansService } from './modules/plans/plans.service';
import { PoisController } from './modules/pois/pois.controller';
import { SearchController } from './modules/search/search.controller';
import { ThemesController } from './modules/themes/themes.controller';
import { VoiceController } from './modules/voice/voice.controller';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [
    HealthController,
    PoisController,
    FoodsController,
    ThemesController,
    SearchController,
    PlansController,
    VoiceController,
    FeedbackController,
    AdminController,
  ],
  providers: [PlansService, AdminGuard],
})
export class AppModule {}
