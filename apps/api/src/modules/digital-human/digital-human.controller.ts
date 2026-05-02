// apps/api/src/modules/digital-human/digital-human.controller.ts
import { Controller, Post, Get, Body, Param, Logger } from '@nestjs/common';
import { DigitalHumanService } from './digital-human.service';

@Controller('voice/digital-human')
export class DigitalHumanController {
  private readonly logger = new Logger(DigitalHumanController.name);

  constructor(private readonly digitalHumanService: DigitalHumanService) {}

  @Post('talk')
  async createTalk(
    @Body() body: { text: string; configId?: string; sourceUrl?: string },
  ) {
    this.logger.log(`Creating digital human talk: ${body.text.slice(0, 50)}...`);
    const result = await this.digitalHumanService.createTalk({
      text: body.text,
      configId: body.configId,
      sourceUrl: body.sourceUrl,
    });
    return result;
  }

  @Get('talk/:id')
  async getTalkStatus(@Param('id') talkId: string) {
    const result = await this.digitalHumanService.getTalkStatus(talkId);
    return result;
  }
}

@Controller('admin/digital-human')
export class DigitalHumanAdminController {
  private readonly logger = new Logger(DigitalHumanAdminController.name);

  constructor(private readonly digitalHumanService: DigitalHumanService) {}

  @Get('configs')
  async listConfigs() {
    return this.digitalHumanService.listConfigs();
  }

  @Post('configs')
  async createConfig(
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
  ) {
    return this.digitalHumanService.createConfig(body);
  }

  @Post('configs/:id/delete')
  async deleteConfig(@Param('id') id: string) {
    return this.digitalHumanService.deleteConfig(id);
  }
}
