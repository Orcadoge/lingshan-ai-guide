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
import { prisma } from '@handan/data';
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

  // === 新增：数据大屏聚合API（基于真实14万游客数据） ===

  @Get('analytics/overview')
  async getAnalyticsOverview(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<unknown> {
    const where: any = {};
    if (from || to) {
      where.visitDate = {};
      if (from) where.visitDate.gte = new Date(from);
      if (to) where.visitDate.lte = new Date(to);
    }

    const [
      totalVisitors,
      totalSessions,
      avgSatisfactionAgg,
      avgCostAgg,
      genderDist,
      ageDist,
    ] = await Promise.all([
      prisma.visitorBehavior.count({ where }),
      prisma.visitorBehavior.groupBy({
        by: ['touristId'],
        where,
        _count: { touristId: true },
      }).then((r) => r.length),
      prisma.visitorBehavior.aggregate({
        where,
        _avg: { satisfaction: true },
      }),
      prisma.visitorBehavior.aggregate({
        where,
        _avg: { totalCost: true },
      }),
      prisma.visitorBehavior.groupBy({
        by: ['gender'],
        where,
        _count: { id: true },
      }),
      prisma.visitorBehavior.groupBy({
        by: ['age'],
        where: { ...where, age: { not: null } },
        _count: { id: true },
        orderBy: { age: 'asc' },
      }),
    ]);

    const satisfaction = avgSatisfactionAgg._avg.satisfaction ?? 0;
    const avgCost = avgCostAgg._avg.totalCost ?? 0;

    return {
      totalVisitors,
      totalSessions,
      avgSatisfaction: satisfaction.toFixed(1),
      satisfactionRate: `${((satisfaction / 5) * 100).toFixed(1)}%`,
      avgCost: avgCost.toFixed(2),
      genderDistribution: genderDist.map((g) => ({
        gender: g.gender || 'unknown',
        count: g._count.id,
      })),
      ageDistribution: ageDist.map((a) => ({
        age: a.age,
        count: a._count.id,
      })),
      period: { from: from || 'all', to: to || 'all' },
    };
  }

  @Get('analytics/sessions')
  async getSessionAnalytics(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<unknown> {
    const where: any = {};
    if (from || to) {
      where.visitDate = {};
      if (from) where.visitDate.gte = new Date(from);
      if (to) where.visitDate.lte = new Date(to);
    }

    const behaviors = await prisma.visitorBehavior.findMany({ where });
    const total = behaviors.length;
    const uniqueVisitors = new Set(behaviors.map((b) => b.touristId)).size;
    const avgGroupSize =
      total > 0
        ? behaviors.reduce((sum, b) => sum + (b.groupSize || 1), 0) / total
        : 0;
    const avgStayDuration =
      total > 0
        ? behaviors.reduce((sum, b) => sum + (b.stayDuration || 0), 0) / total
        : 0;

    return {
      totalBehaviors: total,
      uniqueVisitors,
      avgGroupSize: avgGroupSize.toFixed(1),
      avgStayDuration: avgStayDuration.toFixed(1),
      period: { from: from || 'all', to: to || 'all' },
    };
  }

  @Get('analytics/emotions')
  async getEmotionDistribution(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<unknown> {
    const where: any = {};
    if (from || to) {
      where.visitDate = {};
      if (from) where.visitDate.gte = new Date(from);
      if (to) where.visitDate.lte = new Date(to);
    }

    const behaviors = await prisma.visitorBehavior.findMany({ where });
    const total = behaviors.length;

    // 基于满意度(1-5)映射为情感分布
    // 5→positive, 4→positive, 3→neutral, 2→negative, 1→negative
    const positive = behaviors.filter((b) => (b.satisfaction || 0) >= 4).length;
    const negative = behaviors.filter((b) => (b.satisfaction || 0) <= 2).length;
    const neutral = total - positive - negative;

    return {
      total,
      counts: { positive, neutral, negative },
      percentages: {
        positive: total > 0 ? ((positive / total) * 100).toFixed(1) : '0.0',
        neutral: total > 0 ? ((neutral / total) * 100).toFixed(1) : '0.0',
        negative: total > 0 ? ((negative / total) * 100).toFixed(1) : '0.0',
      },
      // 细粒度：五维情感（基于满意度分布）
      fineDistribution: {
        happy: behaviors.filter((b) => (b.satisfaction || 0) === 5).length,
        calm: behaviors.filter((b) => (b.satisfaction || 0) === 4).length,
        confused: behaviors.filter((b) => (b.satisfaction || 0) === 3).length,
        tired: behaviors.filter((b) => (b.satisfaction || 0) === 2).length,
        dissatisfied: behaviors.filter((b) => (b.satisfaction || 0) === 1).length,
      },
      period: { from: from || 'all', to: to || 'all' },
    };
  }

  @Get('analytics/hot-questions')
  async getHotQuestions(): Promise<unknown> {
    // 基于景点名称统计"热门问答"（游客最常去的景点 ≈ 最关心的问题）
    const hotAttractions = await prisma.visitorBehavior.groupBy({
      by: ['attractionName'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

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

    const sortedQueries = Object.entries(queryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));

    return {
      top10Questions: sortedQueries,
      top10Attractions: hotAttractions.map((a) => ({
        name: a.attractionName,
        visitCount: a._count.id,
      })),
    };
  }

  @Get('analytics/hot-pois')
  async getHotPois(): Promise<unknown> {
    // 基于14万游客数据统计景点热度
    const hotAttractions = await prisma.visitorBehavior.groupBy({
      by: ['attractionName'],
      _count: { id: true },
      _avg: { satisfaction: true, stayDuration: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    return {
      top10: hotAttractions.map((a) => ({
        name: a.attractionName,
        visitCount: a._count.id,
        avgSatisfaction: a._avg.satisfaction?.toFixed(1) || 'N/A',
        avgStayDuration: a._avg.stayDuration?.toFixed(1) || 'N/A',
      })),
    };
  }

  @Get('analytics/satisfaction-trend')
  async getSatisfactionTrend(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<unknown> {
    const where: any = {};
    if (from || to) {
      where.visitDate = {};
      if (from) where.visitDate.gte = new Date(from);
      if (to) where.visitDate.lte = new Date(to);
    }

    // 按日期分组统计满意度趋势
    const behaviors = await prisma.visitorBehavior.findMany({
      where,
      select: { visitDate: true, satisfaction: true },
      orderBy: { visitDate: 'asc' },
    });

    const dailyMap: Record<string, { sum: number; count: number }> = {};
    for (const b of behaviors) {
      if (!b.visitDate) continue;
      const dateKey = b.visitDate.toISOString().split('T')[0];
      if (!dailyMap[dateKey]) dailyMap[dateKey] = { sum: 0, count: 0 };
      if (b.satisfaction !== null) {
        dailyMap[dateKey].sum += b.satisfaction;
        dailyMap[dateKey].count += 1;
      }
    }

    const trend = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, { sum, count }]) => ({
        date,
        avgSatisfaction: count > 0 ? (sum / count).toFixed(2) : null,
        sampleCount: count,
      }));

    return { trend, totalDays: trend.length };
  }

  @Get('digital-human/configs')
  async listDigitalHumanConfigs(): Promise<unknown> {
    const configs = await prisma.digitalHumanConfig.findMany({
      orderBy: { isDefault: 'desc' },
    });
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
    if (body.isDefault) {
      await prisma.digitalHumanConfig.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }
    const config = await prisma.digitalHumanConfig.create({ data: body });
    return config;
  }

  @Post('digital-human/configs/:id/delete')
  async deleteDigitalHumanConfig(@Param('id') id: string): Promise<unknown> {
    const result = await prisma.digitalHumanConfig.delete({ where: { id } });
    return result;
  }
}
