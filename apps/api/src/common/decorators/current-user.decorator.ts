import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { readUserFromHeaders, RequestUser } from '../request-user';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser => {
    const request = ctx.switchToHttp().getRequest();
    if (request.user?.userId || request.user?.id) {
      const user = request.user;
      const uid = user.userId || user.id;
      return {
        userId: uid,
        id: uid,
        workplaceId: user.workplaceId || readUserFromHeaders(request.headers).workplaceId,
        role: user.role || readUserFromHeaders(request.headers).role,
        permissions: user.permissions || readUserFromHeaders(request.headers).permissions,
      };
    }
    const user = readUserFromHeaders(request.headers);
    request.user = user;
    return user;
  },
);

