import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ChatAccessService } from '../chat-access.service';
import { readUserFromHeaders, RequestUser } from '../request-user';

@Injectable()
export class MessageAccessGuard implements CanActivate {
  constructor(private readonly chatAccess: ChatAccessService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user: RequestUser = req.user || readUserFromHeaders(req.headers);
    req.user = user;

    const channelId = req.query?.channelId || req.body?.channelId;
    const conversationId = req.query?.conversationId || req.body?.conversationId;
    const messageId =
      req.params?.messageId ||
      req.params?.parentMessageId ||
      req.body?.messageId ||
      req.params?.id;

    if (channelId) {
      await this.chatAccess.assertChannelAccess(user, channelId);
      return true;
    }

    if (conversationId) {
      await this.chatAccess.assertConversationAccess(user, conversationId);
      return true;
    }

    if (messageId) {
      await this.chatAccess.assertMessageAccess(user, messageId);
      return true;
    }

    return true;
  }
}

