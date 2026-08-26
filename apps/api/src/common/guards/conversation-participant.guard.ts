import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { ChatAccessService } from '../chat-access.service';
import { readUserFromHeaders, RequestUser } from '../request-user';

@Injectable()
export class ConversationParticipantGuard implements CanActivate {
  constructor(private readonly chatAccess: ChatAccessService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user: RequestUser = req.user || readUserFromHeaders(req.headers);
    req.user = user;

    const conversationId =
      req.params?.conversationId ||
      (req.route?.path?.includes('conversations') ? req.params?.id : undefined) ||
      req.query?.conversationId ||
      req.body?.conversationId;

    if (!conversationId) {
      return true;
    }

    await this.chatAccess.assertConversationAccess(user, conversationId);
    return true;
  }
}

