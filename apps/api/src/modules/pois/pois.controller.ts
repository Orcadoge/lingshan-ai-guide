import { Controller, Get, Param, Query } from '@nestjs/common';
import { getApprovedPois, getPoiBySlug } from '@handan/data';

@Controller('pois')
export class PoisController {
  @Get()
  async listPois(
    @Query('district') district?: string,
    @Query('theme') theme?: string,
    @Query('q') q?: string,
  ): Promise<unknown> {
    return getApprovedPois({ district, theme, q });
  }

  @Get(':slug')
  async getPoi(@Param('slug') slug: string): Promise<unknown> {
    return getPoiBySlug(slug);
  }
}
