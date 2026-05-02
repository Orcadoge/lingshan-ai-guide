import { Controller, Get } from '@nestjs/common';
import { healthcheck } from '@handan/data';

@Controller('health')
export class HealthController {
  @Get()
  async getHealth() {
    const status = await healthcheck();
    return {
      ...status,
      service: 'handan-travel-api',
      timestamp: new Date().toISOString(),
    };
  }
}
