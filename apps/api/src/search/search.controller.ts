import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { CurrentUser } from '../common/decorators';
import type { RequestUser } from '../common/request-user';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(@CurrentUser() user: RequestUser, @Query('q') q: string) {
    return this.searchService.search(q, user.id, user.workplaceId);
  }
}
