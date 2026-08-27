import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { ChatAccessService } from '../chat-access.service';
import { attachMockIdentity } from '../mock-identity';

@Injectable()
export class ConversationParticipantGuard implements CanActivate {
  constructor(private readonly chatAccess: ChatAccessService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = attachMockIdentity(req);

    const conversationId =
      req.params?.conversationId ||
      (req.route?.path?.includes('conversations') ? req.params?.id : undefined) ||
      req.query?.conversationId ||
      req.body?.conversationId;

    if (!conversationId || typeof conversationId !== 'string') {
      throw new BadRequestException('conversationId is required');
    }

    await this.chatAccess.assertConversationAccess(user, conversationId);
    return true;
  }
}
