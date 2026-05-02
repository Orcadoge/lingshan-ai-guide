import { Controller, Get, Query } from '@nestjs/common';
import { searchDirectory } from '@handan/data';

@Controller('search')
export class SearchController {
  @Get()
  async search(@Query('q') q = ''): Promise<unknown> {
    return searchDirectory(q);
  }
}
