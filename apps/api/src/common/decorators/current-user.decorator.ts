import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { readUserFromHeaders, RequestUser } from '../request-user';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser => {
    const request = ctx.switchToHttp().getRequest();
    if (request.user?.id) {
      return {
        id: request.user.id,
        workplaceId: request.user.workplaceId ?? readUserFromHeaders(request.headers).workplaceId,
      };
    }
    return readUserFromHeaders(request.headers);
  },
);
