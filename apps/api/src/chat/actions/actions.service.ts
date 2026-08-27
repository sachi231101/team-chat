import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { ChatAccessService, UserContext } from '../../common/chat-access.service';
import { throwInternal } from '../../common/safe-internal-error';
import { RequestUser, DEFAULT_WORKPLACE_ID } from '../../common/request-user';
import { RealtimeService } from '../../realtime/realtime.service';
import { ActionItem, ActionItemStatus } from '@team-chat/shared';
import { CreateActionItemDto } from './dto/create-action-item.dto';
import { UpdateActionItemDto } from './dto/update-action-item.dto';
import { ActionItem as PrismaActionItem, User, Message } from '@prisma/client';

type ActionWithRelations = PrismaActionItem & {
  assignee: User | null;
  creator: User | null;
  message?: (Message & { sender?: User | null }) | null;
};

@Injectable()
export class ActionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatAccess: ChatAccessService,
    private readonly realtime: RealtimeService,
  ) {}

  private extractUser(userOrId: UserContext | string): { userId: string; workplaceId: string } {
    if (typeof userOrId === 'string') {
      return { userId: userOrId, workplaceId: DEFAULT_WORKPLACE_ID };
    }
    const userId = ('userId' in userOrId && userOrId.userId) || ('id' in userOrId && userOrId.id) || '';
    const workplaceId = userOrId.workplaceId || DEFAULT_WORKPLACE_ID;
    return { userId, workplaceId };
  }

  async findAll(
    userOrId: UserContext | string,
    filter: {
      channelId?: string;
      conversationId?: string;
      assigneeId?: string;
      status?: ActionItemStatus;
      messageId?: string;
    } = {},
  ): Promise<ActionItem[]> {
    const user = this.extractUser(userOrId);
    try {
      if (filter.channelId) {
        await this.chatAccess.assertChannelAccess(user, filter.channelId);
      }
      if (filter.conversationId) {
        await this.chatAccess.assertConversationAccess(user, filter.conversationId);
      }
      if (filter.messageId) {
        await this.chatAccess.assertMessageAccess(user, filter.messageId);
      }

      const where: any = { workplaceId: user.workplaceId };
      if (filter.channelId) where.channelId = filter.channelId;
      if (filter.conversationId) where.conversationId = filter.conversationId;
      if (filter.assigneeId) where.assigneeId = filter.assigneeId;
      if (filter.status) where.status = filter.status;
      if (filter.messageId) where.messageId = filter.messageId;

      const rows = await this.prisma.actionItem.findMany({
        where,
        include: {
          assignee: true,
          creator: true,
          message: { include: { sender: true } },
        },
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        take: 100,
      });

      return rows.map((r) => this.mapToDto(r));
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }
      throwInternal('Failed to fetch action items', error);
    }
  }

  async findOne(id: string, userOrId?: UserContext | string): Promise<ActionItem> {
    const item = await this.prisma.actionItem.findUnique({
      where: { id },
      include: {
        assignee: true,
        creator: true,
        message: { include: { sender: true } },
      },
    });

    if (!item) {
      throw new NotFoundException(`Action item ${id} not found`);
    }

    if (userOrId) {
      const user = this.extractUser(userOrId);
      if (item.workplaceId !== user.workplaceId) {
        throw new NotFoundException(`Action item ${id} not found in this workplace`);
      }
      if (item.channelId) await this.chatAccess.assertChannelAccess(user, item.channelId);
      if (item.conversationId) await this.chatAccess.assertConversationAccess(user, item.conversationId);
      if (item.messageId) await this.chatAccess.assertMessageAccess(user, item.messageId);
    }

    return this.mapToDto(item);
  }

  async create(userOrId: UserContext | string, dto: CreateActionItemDto): Promise<ActionItem> {
    const user = this.extractUser(userOrId);
    if (!dto.title || !dto.title.trim()) {
      throw new BadRequestException('Action item title is required');
    }

    try {
      if (dto.channelId) {
        await this.chatAccess.assertChannelAccess(user, dto.channelId);
      }
      if (dto.conversationId) {
        await this.chatAccess.assertConversationAccess(user, dto.conversationId);
      }
      if (dto.messageId) {
        await this.chatAccess.assertMessageAccess(user, dto.messageId);
      }
      if (dto.assigneeId) {
        await this.chatAccess.assertUsersBelongToWorkplace(user.workplaceId, [dto.assigneeId]);
      }

      const item = await this.prisma.actionItem.create({
        data: {
          title: dto.title.trim(),
          description: dto.description?.trim(),
          status: dto.status ?? 'TODO',
          dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
          assigneeId: dto.assigneeId || undefined,
          creatorId: user.userId,
          messageId: dto.messageId || undefined,
          channelId: dto.channelId || undefined,
          conversationId: dto.conversationId || undefined,
          workplaceId: user.workplaceId,
        },
        include: {
          assignee: true,
          creator: true,
          message: { include: { sender: true } },
        },
      });

      const res = this.mapToDto(item);
      if (dto.channelId) {
        this.realtime.emitToChannel(dto.channelId, 'action_item:created', res);
      } else if (dto.conversationId) {
        this.realtime.emitToConversation(dto.conversationId, 'action_item:created', res);
      }

      return res;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throwInternal('Failed to create action item', error);
    }
  }

  async update(
    id: string,
    userOrId: UserContext | string,
    dto: UpdateActionItemDto,
  ): Promise<ActionItem> {
    const user = this.extractUser(userOrId);
    try {
      const existing = await this.prisma.actionItem.findUnique({ where: { id } });
      if (!existing || existing.workplaceId !== user.workplaceId) {
        throw new NotFoundException(`Action item ${id} not found in this workplace`);
      }

      if (dto.assigneeId) {
        await this.chatAccess.assertUsersBelongToWorkplace(user.workplaceId, [dto.assigneeId]);
      }

      const updated = await this.prisma.actionItem.update({
        where: { id },
        data: {
          title: dto.title !== undefined ? dto.title.trim() : undefined,
          description: dto.description !== undefined ? dto.description.trim() : undefined,
          status: dto.status,
          dueDate: dto.dueDate !== undefined ? (dto.dueDate ? new Date(dto.dueDate) : null) : undefined,
          assigneeId: dto.assigneeId !== undefined ? dto.assigneeId : undefined,
        },
        include: {
          assignee: true,
          creator: true,
          message: { include: { sender: true } },
        },
      });

      const res = this.mapToDto(updated);
      if (updated.channelId) {
        this.realtime.emitToChannel(updated.channelId, 'action_item:updated', res);
      } else if (updated.conversationId) {
        this.realtime.emitToConversation(updated.conversationId, 'action_item:updated', res);
      }

      return res;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }
      throwInternal('Failed to update action item', error);
    }
  }

  async delete(id: string, userOrId: UserContext | string): Promise<{ success: boolean }> {
    const user = this.extractUser(userOrId);
    try {
      const existing = await this.prisma.actionItem.findUnique({ where: { id } });
      if (!existing || existing.workplaceId !== user.workplaceId) {
        throw new NotFoundException(`Action item ${id} not found in this workplace`);
      }

      await this.prisma.actionItem.delete({ where: { id } });

      if (existing.channelId) {
        this.realtime.emitToChannel(existing.channelId, 'action_item:deleted', { id });
      } else if (existing.conversationId) {
        this.realtime.emitToConversation(existing.conversationId, 'action_item:deleted', { id });
      }

      return { success: true };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
      throwInternal('Failed to delete action item', error);
    }
  }

  private mapToDto(item: ActionWithRelations): ActionItem {
    return {
      id: item.id,
      title: item.title,
      description: item.description ?? undefined,
      status: item.status as ActionItemStatus,
      dueDate: item.dueDate?.toISOString(),
      assigneeId: item.assigneeId ?? undefined,
      assigneeName: item.assignee?.name ?? undefined,
      assigneeAvatar: item.assignee?.avatarUrl ?? undefined,
      creatorId: item.creatorId,
      creatorName: item.creator?.name ?? undefined,
      messageId: item.messageId ?? undefined,
      messageSnippet: item.message?.content ? item.message.content.slice(0, 100) : undefined,
      channelId: item.channelId ?? undefined,
      conversationId: item.conversationId ?? undefined,
      workplaceId: item.workplaceId,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }
}

