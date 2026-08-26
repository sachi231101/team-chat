import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ChatAccessService } from '../chat-access.service';
import { readUserFromHeaders, RequestUser } from '../request-user';

@Injectable()
export class ChannelMemberGuard implements CanActivate {
  constructor(private readonly chatAccess: ChatAccessService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user: RequestUser = req.user || readUserFromHeaders(req.headers);
    req.user = user;

    const channelId =
      req.params?.channelId ||
      (req.route?.path?.includes('channels') ? req.params?.id : undefined) ||
      req.query?.channelId ||
      req.body?.channelId;

    if (!channelId) {
      return true;
    }

    try {
      await this.chatAccess.assertChannelAccess(user, channelId);
      return true;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw error;
    }
  }
}

