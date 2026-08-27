import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { attachMockIdentity } from '../mock-identity';
import type { RequestUser } from '../request-user';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser => {
    const request = ctx.switchToHttp().getRequest();
    return attachMockIdentity(request);
  },
);
