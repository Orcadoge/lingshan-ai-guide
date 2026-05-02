// apps/api/src/modules/emotion/emotion.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { TextSentimentService } from './text-sentiment.service';

interface RecordEmotionDto {
  sessionId: string;
  textContent: string;
  source?: 'TEXT' | 'VOICE' | 'FACE';
  poiId?: string;
}

interface EmotionDistribution {
  total: number;
  distribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  percentages: {
    positive: string;
    neutral: string;
    negative: string;
  };
}

@Injectable()
export class EmotionService {
  private readonly logger = new Logger(EmotionService.name);
  private readonly prisma: PrismaClient;

  constructor(private readonly textSentiment: TextSentimentService) {
    this.prisma = new PrismaClient();
  }

  async recordEmotion({ sessionId, textContent, source = 'TEXT', poiId }: RecordEmotionDto) {
    // 1. 情感分析
    const sentiment = await this.textSentiment.analyze(textContent);

    // 2. 确保VisitorSession存在
    let visitorSession = await this.prisma.visitorSession.findUnique({
      where: { id: sessionId },
    });
    if (!visitorSession) {
      visitorSession = await this.prisma.visitorSession.create({
        data: {
          id: sessionId,
          source,
          startedAt: new Date(),
        },
      });
    }

    // 3. 写入情感记录
    const emotion = await this.prisma.visitorEmotion.create({
      data: {
        sessionId,
        source,
        textContent,
        textSentiment: sentiment as unknown as Prisma.InputJsonValue,
        poiId: poiId || null,
        createdAt: new Date(),
      },
    });

    // 4. 更新SessionAnalytics汇总
    await this.updateSessionAnalytics(sessionId);

    return {
      ok: true,
      emotionId: emotion.id,
      sentiment,
    };
  }

  private async updateSessionAnalytics(sessionId: string) {
    const emotions = await this.prisma.visitorEmotion.findMany({
      where: { sessionId },
    });

    const total = emotions.length;
    const positive = emotions.filter(e => {
      const s = e.textSentiment as any;
      return s?.emotion === 'positive';
    }).length;
    const negative = emotions.filter(e => {
      const s = e.textSentiment as any;
      return s?.emotion === 'negative';
    }).length;
    const neutral = total - positive - negative;

    const topEmotion = positive >= negative && positive >= neutral ? 'positive'
      : negative >= positive && negative >= neutral ? 'negative'
      : 'neutral';

    await this.prisma.sessionAnalytics.upsert({
      where: { sessionId },
      create: {
        sessionId,
        totalEmotions: total,
        positiveCount: positive,
        neutralCount: neutral,
        negativeCount: negative,
        topEmotion,
        updatedAt: new Date(),
      },
      update: {
        totalEmotions: total,
        positiveCount: positive,
        neutralCount: neutral,
        negativeCount: negative,
        topEmotion,
        updatedAt: new Date(),
      },
    });
  }

  async getSessionEmotions(sessionId: string) {
    const emotions = await this.prisma.visitorEmotion.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      ok: true,
      count: emotions.length,
      emotions: emotions.map(e => ({
        id: e.id,
        textContent: e.textContent,
        source: e.source,
        sentiment: e.textSentiment,
        poiId: e.poiId,
        createdAt: e.createdAt,
      })),
    };
  }

  async getEmotionDistribution(from?: string, to?: string): Promise<EmotionDistribution> {
    const where: Prisma.VisitorEmotionWhereInput = {};
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const emotions = await this.prisma.visitorEmotion.findMany({ where });
    const total = emotions.length;

    const positive = emotions.filter(e => {
      const s = e.textSentiment as any;
      return s?.emotion === 'positive';
    }).length;
    const negative = emotions.filter(e => {
      const s = e.textSentiment as any;
      return s?.emotion === 'negative';
    }).length;
    const neutral = total - positive - negative;

    return {
      total,
      distribution: { positive, neutral, negative },
      percentages: {
        positive: total > 0 ? ((positive / total) * 100).toFixed(1) : '0.0',
        neutral: total > 0 ? ((neutral / total) * 100).toFixed(1) : '0.0',
        negative: total > 0 ? ((negative / total) * 100).toFixed(1) : '0.0',
      },
    };
  }
}
