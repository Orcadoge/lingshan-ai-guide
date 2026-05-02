import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import {
  getAllPromptConfigs,
  getApprovedFoodVenues,
  getApprovedPois,
  publishPromptConfig,
  upsertFoodVenue,
  upsertPoi,
} from '@handan/data';
import {
  adminUpsertFoodVenueSchema,
  adminUpsertPoiSchema,
  type AdminUpsertFoodVenueInput,
  type AdminUpsertPoiInput,
} from '@handan/shared';

import { AdminGuard } from '../../common/decorators/admin.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@UseGuards(AdminGuard)
@Controller('admin')
export class AdminController {
  @Get('overview')
  async getOverview(): Promise<unknown> {
    const [pois, foods, prompts] = await Promise.all([
      getApprovedPois(),
      getApprovedFoodVenues(),
      getAllPromptConfigs(),
    ]);

    return {
      counts: {
        pois: pois.length,
        foodVenues: foods.length,
        promptConfigs: prompts.length,
      },
      prompts,
    };
  }

  @Get('prompts')
  async getPrompts(): Promise<unknown> {
    return getAllPromptConfigs();
  }

  @Post('pois')
  @UsePipes(new ZodValidationPipe(adminUpsertPoiSchema))
  async createPoi(@Body() body: AdminUpsertPoiInput): Promise<unknown> {
    return upsertPoi(body);
  }

  @Put('pois/:id')
  @UsePipes(new ZodValidationPipe(adminUpsertPoiSchema))
  async updatePoi(
    @Param('id') id: string,
    @Body() body: AdminUpsertPoiInput,
  ): Promise<unknown> {
    return upsertPoi({ ...body, id });
  }

  @Post('foods')
  @UsePipes(new ZodValidationPipe(adminUpsertFoodVenueSchema))
  async createFood(@Body() body: AdminUpsertFoodVenueInput): Promise<unknown> {
    return upsertFoodVenue(body);
  }

  @Put('foods/:id')
  @UsePipes(new ZodValidationPipe(adminUpsertFoodVenueSchema))
  async updateFood(
    @Param('id') id: string,
    @Body() body: AdminUpsertFoodVenueInput,
  ): Promise<unknown> {
    return upsertFoodVenue({ ...body, id });
  }

  @Post('reindex')
  async reindex(): Promise<unknown> {
    return {
      ok: true,
      message: 'MVP 阶段暂用 PostgreSQL 查询，无需额外向量重建。',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('prompts/publish')
  async publishPrompt(@Body('id') id: string): Promise<unknown> {
    return publishPromptConfig(id);
  }
}
