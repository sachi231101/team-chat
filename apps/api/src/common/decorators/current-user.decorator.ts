import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return (
      request.user || {
        id: request.headers['x-user-id'] || 'usr-rahul',
        workplaceId: request.headers['x-workplace-id'] || 'wp-teamchat-main',
      }
    );
  },
);
