import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { ChatAccessService, UserContext } from '../../common/chat-access.service';
import { RequestUser, DEFAULT_WORKPLACE_ID } from '../../common/request-user';
import { RealtimeService } from '../../realtime/realtime.service';
import { MessageTag, MessageTagType, Message } from '@team-chat/shared';
import { ToggleTagDto } from './dto/toggle-tag.dto';
import { MessagesService } from '../messages/messages.service';

@Injectable()
export class TagsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatAccess: ChatAccessService,
    private readonly realtime: RealtimeService,
    private readonly messagesService: MessagesService,
  ) {}

  private extractUser(userOrId: UserContext | string): { userId: string; workplaceId: string } {
    if (typeof userOrId === 'string') {
      return { userId: userOrId, workplaceId: DEFAULT_WORKPLACE_ID };
    }
    const userId = ('userId' in userOrId && userOrId.userId) || ('id' in userOrId && userOrId.id) || '';
    const workplaceId = userOrId.workplaceId || DEFAULT_WORKPLACE_ID;
    return { userId, workplaceId };
  }

  async toggleTag(
    messageId: string,
    userOrId: UserContext | string,
    dto: ToggleTagDto,
  ): Promise<{ added: boolean; tag?: MessageTag; message: Message }> {
    const user = this.extractUser(userOrId);
    try {
      await this.chatAccess.assertMessageAccess(user, messageId);

      const existing = await this.prisma.messageTag.findUnique({
        where: {
          messageId_tag: {
            messageId,
            tag: dto.tag,
          },
        },
      });

      let added = false;
      let createdTag: any = null;

      if (existing) {
        await this.prisma.messageTag.delete({
          where: { id: existing.id },
        });
        added = false;
      } else {
        createdTag = await this.prisma.messageTag.create({
          data: {
            messageId,
            userId: user.userId,
            tag: dto.tag,
            note: dto.note?.trim(),
          },
          include: { user: true },
        });
        added = true;
      }

      const updatedMsgDto = await this.messagesService.findOne(messageId, user);
      this.realtime.emitToChat(updatedMsgDto, 'tag:toggled', {
        messageId,
        tag: dto.tag,
        added,
        message: updatedMsgDto,
      });

      return {
        added,
        tag: createdTag
          ? {
              id: createdTag.id,
              messageId: createdTag.messageId,
              userId: createdTag.userId,
              userName: createdTag.user?.name,
              tag: createdTag.tag as MessageTagType,
              note: createdTag.note ?? undefined,
              createdAt: createdTag.createdAt.toISOString(),
            }
          : undefined,
        message: updatedMsgDto,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
      throw new InternalServerErrorException(
        `Failed to toggle tag: ${(error as Error).message}`,
      );
    }
  }

  async findDecisions(
    channelId?: string,
    conversationId?: string,
    userOrId?: UserContext | string,
  ): Promise<Message[]> {
    try {
      let workplaceId = DEFAULT_WORKPLACE_ID;
      if (userOrId) {
        const user = this.extractUser(userOrId);
        workplaceId = user.workplaceId;
        if (channelId) await this.chatAccess.assertChannelAccess(user, channelId);
        if (conversationId) await this.chatAccess.assertConversationAccess(user, conversationId);
      }

      const where: any = {
        deletedAt: null,
        tags: {
          some: {
            tag: { in: ['DECISION', 'KEY_TAKEAWAY', 'ANNOUNCEMENT', 'FOLLOW_UP'] },
          },
        },
      };
      if (channelId) {
        where.channelId = channelId;
      } else if (conversationId) {
        where.conversationId = conversationId;
      } else {
        where.OR = [
          { channel: { workplaceId } },
          { conversation: { workplaceId } },
        ];
      }

      const messages = await this.prisma.message.findMany({
        where,
        include: {
          sender: true,
          reactions: { include: { user: true } },
          attachments: true,
          replies: { where: { deletedAt: null } },
          tags: { include: { user: true } },
          actionItems: { include: { assignee: true, creator: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      return messages.map((m) => this.messagesService.mapMessageToDto(m as any));
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
      throw new InternalServerErrorException(
        `Failed to fetch decisions: ${(error as Error).message}`,
      );
    }
  }
}

