import { Controller, Get, Query } from '@nestjs/common';
import { SearchService, SearchScope } from './search.service';
import { CurrentUser } from '../common/decorators';
import type { RequestUser } from '../common/request-user';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(
    @CurrentUser() user: RequestUser,
    @Query('q') q: string,
    @Query('scope') scope?: string,
  ) {
    const allowed: SearchScope[] = ['all', 'channels', 'people', 'messages'];
    const resolved: SearchScope = allowed.includes(scope as SearchScope)
      ? (scope as SearchScope)
      : 'all';
    return this.searchService.search(q ?? '', user.userId, user.workplaceId, resolved);
  }
}
