import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

interface TalkRequest {
  text: string;
  configId?: string;
  sourceUrl?: string;
}

interface TalkResult {
  ok: boolean;
  talkId?: string;
  status: string;
  previewUrl?: string;
  mock: boolean;
}

@Injectable()
export class DigitalHumanService {
  private readonly logger = new Logger(DigitalHumanService.name);
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async createTalk({ text, configId, sourceUrl }: TalkRequest): Promise<TalkResult> {
    this.logger.log(`Digital human talk requested: ${text.slice(0, 50)}...`);
    
    // 确定使用的数字人形象
    let finalSourceUrl = sourceUrl;
    if (!finalSourceUrl && configId) {
      const config = await this.prisma.digitalHumanConfig.findUnique({
        where: { id: configId },
      });
      if (config) {
        finalSourceUrl = config.sourceUrl || undefined;
      }
    }
    if (!finalSourceUrl) {
      const defaultConfig = await this.prisma.digitalHumanConfig.findFirst({
        where: { isDefault: true },
      });
      if (defaultConfig) {
        finalSourceUrl = defaultConfig.sourceUrl || undefined;
      }
    }
    if (!finalSourceUrl) {
      finalSourceUrl = '/images/avatar-tourguide.jpg';
    }

    // 纯前端模拟模式：返回静态响应，实际渲染由前端CSS动画完成
    return {
      ok: true,
      talkId: `local_${Date.now()}`,
      status: 'completed',
      previewUrl: finalSourceUrl,
      mock: true,
    };
  }

  async getTalkStatus(talkId: string): Promise<TalkResult> {
    return {
      ok: true,
      talkId,
      status: 'completed',
      previewUrl: '/images/avatar-tourguide.jpg',
      mock: true,
    };
  }

  async listConfigs() {
    return this.prisma.digitalHumanConfig.findMany({
      orderBy: { isDefault: 'desc' },
    });
  }

  async createConfig(data: {
    name: string;
    provider: string;
    avatarImageUrl?: string;
    sourceUrl?: string;
    voiceType?: string;
    modelId?: string;
    isDefault?: boolean;
    configJson?: string;
  }) {
    if (data.isDefault) {
      await this.prisma.digitalHumanConfig.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }
    return this.prisma.digitalHumanConfig.create({ data });
  }

  async deleteConfig(id: string) {
    return this.prisma.digitalHumanConfig.delete({ where: { id } });
  }
}
