import { Controller, Get, Param, Query } from '@nestjs/common';
import { getFoodCatalog, getFoodDetailBySlug } from '@handan/data';

@Controller('foods')
export class FoodsController {
  @Get()
  async listFoods(
    @Query('district') district?: string,
    @Query('theme') theme?: string,
    @Query('q') q?: string,
  ): Promise<unknown> {
    return getFoodCatalog({ district, theme, q });
  }

  @Get(':slug')
  async getFood(@Param('slug') slug: string): Promise<unknown> {
    return getFoodDetailBySlug(slug);
  }
}
