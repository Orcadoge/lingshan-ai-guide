import { Controller, Get, Param } from '@nestjs/common';
import { getThemeDetail, getThemes } from '@handan/data';

@Controller('themes')
export class ThemesController {
  @Get()
  async listThemes(): Promise<unknown> {
    return getThemes();
  }

  @Get(':slug')
  async getTheme(@Param('slug') slug: string): Promise<unknown> {
    return getThemeDetail(slug);
  }
}
