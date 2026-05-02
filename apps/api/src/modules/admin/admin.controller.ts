import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
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

  // === 新增：数据大屏聚合API ===

  @Get('analytics/sessions')
  async getSessionAnalytics(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<unknown> {
    const prisma = new PrismaClient();
    const where: any = {};
    if (from || to) {
      where.startedAt = {};
      if (from) where.startedAt.gte = new Date(from);
      if (to) where.startedAt.lte = new Date(to);
    }

    const sessions = await prisma.visitorSession.findMany({ where });
    const total = sessions.length;
    const withVoice = sessions.filter((s: any) => s.hasVoice).length;
    const withDigitalHuman = sessions.filter((s: any) => s.hasDigitalHuman).length;
    const avgMessages = total > 0
      ? sessions.reduce((sum: number, s: any) => sum + s.messageCount, 0) / total
      : 0;
    const completed = sessions.filter((s: any) => s.conversionStatus === 'completed').length;
    const conversionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : '0.0';

    await prisma.$disconnect();
    return {
      totalSessions: total,
      withVoice,
      withDigitalHuman,
      avgMessagesPerSession: avgMessages.toFixed(1),
      conversionRate: `${conversionRate}%`,
    };
  }

  @Get('analytics/emotions')
  async getEmotionDistribution(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<unknown> {
    const prisma = new PrismaClient();
    const where: any = {};
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const emotions = await prisma.visitorEmotion.findMany({ where });
    const total = emotions.length;

    const positive = emotions.filter((e: any) => {
      const s = e.textSentiment as any;
      return s?.emotion === 'positive';
    }).length;
    const negative = emotions.filter((e: any) => {
      const s = e.textSentiment as any;
      return s?.emotion === 'negative';
    }).length;
    const neutral = total - positive - negative;

    await prisma.$disconnect();
    return {
      total,
      counts: { positive, neutral, negative, other: 0 },
      percentages: {
        positive: total > 0 ? ((positive / total) * 100).toFixed(1) : '0.0',
        neutral: total > 0 ? ((neutral / total) * 100).toFixed(1) : '0.0',
        negative: total > 0 ? ((negative / total) * 100).toFixed(1) : '0.0',
      },
      period: { from: from || 'all', to: to || 'all' },
    };
  }

  @Get('analytics/hot-questions')
  async getHotQuestions(): Promise<unknown> {
    const prisma = new PrismaClient();
    const sessions = await prisma.planSession.findMany({
      take: 1000,
      orderBy: { createdAt: 'desc' },
    });

    const queryCounts: Record<string, number> = {};
    for (const session of sessions) {
      const payload = session.inputPayload as any;
      const query = payload?.query || payload?.text || '';
      if (query && query.length > 1) {
        queryCounts[query] = (queryCounts[query] || 0) + 1;
      }
    }

    const sorted = Object.entries(queryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));

    await prisma.$disconnect();
    return { top10: sorted };
  }

  @Get('analytics/hot-pois')
  async getHotPois(): Promise<unknown> {
    const prisma = new PrismaClient();
    const emotions = await prisma.visitorEmotion.findMany({
      where: { poiId: { not: null } },
    });

    const poiCounts: Record<string, number> = {};
    for (const e of emotions) {
      if (e.poiId) {
        poiCounts[e.poiId] = (poiCounts[e.poiId] || 0) + 1;
      }
    }

    const sorted = Object.entries(poiCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([poiId, count]) => ({ poiId, count }));

    await prisma.$disconnect();
    return { top10: sorted };
  }

  @Get('digital-human/configs')
  async listDigitalHumanConfigs(): Promise<unknown> {
    const prisma = new PrismaClient();
    const configs = await prisma.digitalHumanConfig.findMany({
      orderBy: { isDefault: 'desc' },
    });
    await prisma.$disconnect();
    return configs;
  }

  @Post('digital-human/configs')
  async createDigitalHumanConfig(
    @Body() body: {
      name: string;
      provider: string;
      avatarImageUrl?: string;
      sourceUrl?: string;
      voiceType?: string;
      modelId?: string;
      isDefault?: boolean;
      configJson?: string;
    },
  ): Promise<unknown> {
    const prisma = new PrismaClient();
    if (body.isDefault) {
      await prisma.digitalHumanConfig.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }
    const config = await prisma.digitalHumanConfig.create({ data: body });
    await prisma.$disconnect();
    return config;
  }

  @Post('digital-human/configs/:id/delete')
  async deleteDigitalHumanConfig(@Param('id') id: string): Promise<unknown> {
    const prisma = new PrismaClient();
    const result = await prisma.digitalHumanConfig.delete({ where: { id } });
    await prisma.$disconnect();
    return result;
  }
}
