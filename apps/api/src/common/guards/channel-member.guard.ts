import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ChatAccessService } from '../chat-access.service';
import { attachMockIdentity } from '../mock-identity';

@Injectable()
export class ChannelMemberGuard implements CanActivate {
  constructor(private readonly chatAccess: ChatAccessService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = attachMockIdentity(req);

    const channelId =
      req.params?.channelId ||
      (req.route?.path?.includes('channels') ? req.params?.id : undefined) ||
      req.query?.channelId ||
      req.body?.channelId;

    if (!channelId || typeof channelId !== 'string') {
      throw new BadRequestException('channelId is required');
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
