import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { ChatAccessService } from '../../common/chat-access.service';
import { RealtimeService } from '../../realtime/realtime.service';
import type { RequestUser } from '../../common/request-user';


export interface PollStats {
  id: string;
  question: string;
  options: {
    index: number;
    text: string;
    voteCount: number;
    percentage: number;
    hasVoted: boolean;
    voters?: { id: string; name: string; avatarUrl?: string | null }[];
  }[];
  totalVotes: number;
  totalVoters: number;
  isMultiChoice: boolean;
  isAnonymous: boolean;
  isClosed: boolean;
  createdById: string;
  creatorName?: string;
  messageId?: string | null;
  channelId?: string | null;
  conversationId?: string | null;
  createdAt: Date;
}

@Injectable()
export class PollsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatAccess: ChatAccessService,
    private readonly realtime: RealtimeService,
  ) {}

  async createPoll(
    user: RequestUser,
    data: {
      question: string;
      options: string[];
      isMultiChoice?: boolean;
      isAnonymous?: boolean;
      channelId?: string;
      conversationId?: string;
    },
  ): Promise<PollStats> {
    const question = data.question?.trim();
    if (!question) {
      throw new BadRequestException('Poll question is required');
    }

    const cleanOptions = (data.options || [])
      .map((opt) => opt.trim())
      .filter((opt) => opt.length > 0);

    if (cleanOptions.length < 2) {
      throw new BadRequestException('Poll must have at least 2 options');
    }

    if (cleanOptions.length > 10) {
      throw new BadRequestException('Poll cannot have more than 10 options');
    }

    if (!data.channelId && !data.conversationId) {
      throw new BadRequestException('Either channelId or conversationId is required');
    }

    if (data.channelId) {
      await this.chatAccess.assertChannelAccess(user, data.channelId);
    } else if (data.conversationId) {
      await this.chatAccess.assertConversationAccess(user, data.conversationId);
    }

    // Create message with attached poll in a transaction
    const poll = await this.prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          content: `📊 **Poll**: ${question}`,
          senderId: user.userId,
          channelId: data.channelId,
          conversationId: data.conversationId,
        },
      });

      return tx.poll.create({
        data: {
          question,
          options: cleanOptions,
          isMultiChoice: Boolean(data.isMultiChoice),
          isAnonymous: Boolean(data.isAnonymous),
          createdById: user.userId,
          messageId: message.id,
          channelId: data.channelId,
          conversationId: data.conversationId,
          workplaceId: user.workplaceId,
        },
        include: {
          creator: true,
          votes: {
            include: {
              user: true,
            },
          },
        },
      });
    });

    const stats = this.formatPollStats(poll, user.userId);

    // Broadcast poll & message creation in realtime
    if (poll.channelId) {
      this.realtime.emitToChannel(poll.channelId, 'poll:created', stats);
      this.realtime.emitToChannel(poll.channelId, 'message:created', {
        id: poll.messageId,
        channelId: poll.channelId,
        senderId: user.userId,
        content: `📊 **Poll**: ${question}`,
        poll: stats,
        createdAt: poll.createdAt,
      });
    } else if (poll.conversationId) {
      this.realtime.emitToConversation(poll.conversationId, 'poll:created', stats);
      this.realtime.emitToConversation(poll.conversationId, 'message:created', {
        id: poll.messageId,
        conversationId: poll.conversationId,
        senderId: user.userId,
        content: `📊 **Poll**: ${question}`,
        poll: stats,
        createdAt: poll.createdAt,
      });
    }

    return stats;
  }

  async getPoll(user: RequestUser, id: string): Promise<PollStats> {
    const poll = await this.prisma.poll.findFirst({
      where: {
        id,
        workplaceId: user.workplaceId,
      },
      include: {
        creator: true,
        votes: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    if (poll.channelId) {
      await this.chatAccess.assertChannelAccess(user, poll.channelId);
    } else if (poll.conversationId) {
      await this.chatAccess.assertConversationAccess(user, poll.conversationId);
    }

    return this.formatPollStats(poll, user.userId);
  }

  async vote(user: RequestUser, pollId: string, optionIndex: number): Promise<PollStats> {
    const poll = await this.prisma.poll.findFirst({
      where: {
        id: pollId,
        workplaceId: user.workplaceId,
      },
      include: {
        votes: true,
      },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    if (poll.isClosed) {
      throw new BadRequestException('This poll is closed');
    }

    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      throw new BadRequestException('Invalid option index');
    }

    if (poll.channelId) {
      await this.chatAccess.assertChannelAccess(user, poll.channelId);
    } else if (poll.conversationId) {
      await this.chatAccess.assertConversationAccess(user, poll.conversationId);
    }

    const existingVotes = poll.votes.filter((v) => v.userId === user.userId);
    const existingOptionVote = existingVotes.find((v) => v.optionIndex === optionIndex);

    await this.prisma.$transaction(async (tx) => {
      if (existingOptionVote) {
        // Toggle off
        await tx.pollVote.delete({
          where: {
            id: existingOptionVote.id,
          },
        });
      } else {
        if (!poll.isMultiChoice && existingVotes.length > 0) {
          // Remove previous single choice vote
          await tx.pollVote.deleteMany({
            where: {
              pollId,
              userId: user.userId,
            },
          });
        }

        await tx.pollVote.create({
          data: {
            pollId,
            optionIndex,
            userId: user.userId,
            workplaceId: user.workplaceId,
          },
        });
      }
    });

    const updated = await this.prisma.poll.findUniqueOrThrow({
      where: { id: pollId },
      include: {
        creator: true,
        votes: {
          include: {
            user: true,
          },
        },
      },
    });

    const stats = this.formatPollStats(updated, user.userId);

    // Broadcast live vote update
    if (poll.channelId) {
      this.realtime.emitToChannel(poll.channelId, 'poll:updated', stats);
    } else if (poll.conversationId) {
      this.realtime.emitToConversation(poll.conversationId, 'poll:updated', stats);
    }

    return stats;
  }

  async closePoll(user: RequestUser, pollId: string, isClosed = true): Promise<PollStats> {
    const poll = await this.prisma.poll.findFirst({
      where: {
        id: pollId,
        workplaceId: user.workplaceId,
      },
      include: {
        creator: true,
        votes: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    if (poll.createdById !== user.userId && user.role !== 'admin') {
      throw new ForbiddenException('Only the poll creator or admin can close this poll');
    }

    const updated = await this.prisma.poll.update({
      where: { id: pollId },
      data: { isClosed },
      include: {
        creator: true,
        votes: {
          include: {
            user: true,
          },
        },
      },
    });

    const stats = this.formatPollStats(updated, user.userId);

    if (poll.channelId) {
      this.realtime.emitToChannel(poll.channelId, 'poll:updated', stats);
    } else if (poll.conversationId) {
      this.realtime.emitToConversation(poll.conversationId, 'poll:updated', stats);
    }

    return stats;
  }

  private formatPollStats(
    poll: any,
    currentUserId: string,
  ): PollStats {
    const totalVotes = poll.votes.length;
    const uniqueVoters = new Set(poll.votes.map((v: any) => v.userId)).size;

    const options = poll.options.map((text: string, index: number) => {
      const optionVotes = poll.votes.filter((v: any) => v.optionIndex === index);
      const voteCount = optionVotes.length;
      const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
      const hasVoted = optionVotes.some((v: any) => v.userId === currentUserId);

      const voters = poll.isAnonymous
        ? undefined
        : optionVotes.map((v: any) => ({
            id: v.user.id,
            name: v.user.name,
            avatarUrl: v.user.avatarUrl,
          }));

      return {
        index,
        text,
        voteCount,
        percentage,
        hasVoted,
        voters,
      };
    });

    return {
      id: poll.id,
      question: poll.question,
      options,
      totalVotes,
      totalVoters: uniqueVoters,
      isMultiChoice: poll.isMultiChoice,
      isAnonymous: poll.isAnonymous,
      isClosed: poll.isClosed,
      createdById: poll.createdById,
      creatorName: poll.creator?.name,
      messageId: poll.messageId,
      channelId: poll.channelId,
      conversationId: poll.conversationId,
      createdAt: poll.createdAt,
    };
  }
}
