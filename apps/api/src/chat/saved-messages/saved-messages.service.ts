import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { ChatAccessService, UserContext } from '../../common/chat-access.service';
import { throwInternal } from '../../common/safe-internal-error';
import { RequestUser, DEFAULT_WORKPLACE_ID } from '../../common/request-user';
import { Message } from '@team-chat/shared';
import { MessagesService } from '../messages/messages.service';

@Injectable()
export class SavedMessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatAccess: ChatAccessService,
    private readonly messages: MessagesService,
  ) {}

  private extractUser(userOrId: UserContext | string): { userId: string; workplaceId: string } {
    if (typeof userOrId === 'string') {
      return { userId: userOrId, workplaceId: DEFAULT_WORKPLACE_ID };
    }
    const userId = ('userId' in userOrId && userOrId.userId) || ('id' in userOrId && userOrId.id) || '';
    const workplaceId = userOrId.workplaceId || DEFAULT_WORKPLACE_ID;
    return { userId, workplaceId };
  }

  async listIds(userOrId: UserContext | string): Promise<string[]> {
    const user = this.extractUser(userOrId);
    const rows = await this.prisma.savedMessage.findMany({
      where: {
        userId: user.userId,
        message: {
          deletedAt: null,
          OR: [
            { channel: { workplaceId: user.workplaceId } },
            { conversation: { workplaceId: user.workplaceId } },
          ],
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => r.messageId);
  }

  async listMessages(userOrId: UserContext | string): Promise<Message[]> {
    const user = this.extractUser(userOrId);
    const rows = await this.prisma.savedMessage.findMany({
      where: {
        userId: user.userId,
        message: {
          deletedAt: null,
          OR: [
            { channel: { workplaceId: user.workplaceId } },
            { conversation: { workplaceId: user.workplaceId } },
          ],
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        message: {
          include: {
            sender: true,
            reactions: { include: { user: true } },
            attachments: true,
            replies: { where: { deletedAt: null } },
            tags: { include: { user: true } },
            actionItems: { include: { assignee: true, creator: true } },
          },
        },
      },
    });
    return rows
      .filter((r) => r.message && !r.message.deletedAt)
      .map((r) => this.messages.mapMessageToDto(r.message as any));
  }

  async toggle(userOrId: UserContext | string, messageId: string): Promise<{ saved: boolean; ids: string[] }> {
    const user = this.extractUser(userOrId);
    try {
      await this.chatAccess.assertMessageAccess(user, messageId);

      const existing = await this.prisma.savedMessage.findUnique({
        where: { userId_messageId: { userId: user.userId, messageId } },
      });

      if (existing) {
        await this.prisma.savedMessage.delete({ where: { id: existing.id } });
      } else {
        await this.prisma.savedMessage.create({ data: { userId: user.userId, messageId } });
      }

      return { saved: !existing, ids: await this.listIds(user) };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
      throwInternal('Failed to toggle saved message', error);
    }
  }
}

