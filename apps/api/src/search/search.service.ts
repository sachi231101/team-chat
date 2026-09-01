import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { throwInternal } from '../common/safe-internal-error';

export type SearchScope = 'all' | 'channels' | 'people' | 'messages';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(
    query: string,
    userId: string,
    workplaceId: string = 'ws-acme-hq-dev',
    scope: SearchScope = 'all',
  ) {
    if (!query || !query.trim()) {
      return { messages: [], channels: [], users: [], scope };
    }

    // Slack-style prefixes: #channel  @person  (rest = messages / all)
    let q = query.trim();
    let effectiveScope: SearchScope = scope;
    if (q.startsWith('#')) {
      effectiveScope = 'channels';
      q = q.slice(1).trim();
    } else if (q.startsWith('@')) {
      effectiveScope = 'people';
      q = q.slice(1).trim();
    }

    if (!q) {
      return { messages: [], channels: [], users: [], scope: effectiveScope };
    }

    try {
      const memberships = await this.prisma.channelMember.findMany({
        where: { userId },
        select: { channelId: true },
      });
      const memberChannelIds = memberships.map((m) => m.channelId);

      const participantConvos = await this.prisma.conversationParticipant.findMany({
        where: { userId },
        select: { conversationId: true },
      });
      const conversationIds = participantConvos.map((p) => p.conversationId);

      const wantChannels = effectiveScope === 'all' || effectiveScope === 'channels';
      const wantPeople = effectiveScope === 'all' || effectiveScope === 'people';
      const wantMessages = effectiveScope === 'all' || effectiveScope === 'messages';

      const [messages, channels, users] = await Promise.all([
        wantMessages
          ? this.prisma.message.findMany({
              where: {
                content: { contains: q, mode: 'insensitive' },
                deletedAt: null,
                scheduledFor: null,
                OR: [
                  {
                    channel: {
                      workplaceId,
                      OR: [{ type: 'PUBLIC' }, { id: { in: memberChannelIds } }],
                    },
                  },
                  {
                    conversation: { workplaceId },
                    conversationId: { in: conversationIds },
                  },
                ],
              },
              include: {
                sender: true,
                channel: { select: { id: true, name: true } },
              },
              take: 25,
              orderBy: { createdAt: 'desc' },
            })
          : Promise.resolve([]),
        wantChannels
          ? this.prisma.channel.findMany({
              where: {
                workplaceId,
                OR: [
                  { name: { contains: q, mode: 'insensitive' } },
                  { description: { contains: q, mode: 'insensitive' } },
                  { topic: { contains: q, mode: 'insensitive' } },
                ],
                AND: [
                  {
                    OR: [{ type: 'PUBLIC' }, { id: { in: memberChannelIds } }],
                  },
                ],
              },
              take: 15,
              orderBy: { name: 'asc' },
            })
          : Promise.resolve([]),
        wantPeople
          ? this.prisma.user.findMany({
              where: {
                workplaceId,
                OR: [
                  { name: { contains: q, mode: 'insensitive' } },
                  { email: { contains: q, mode: 'insensitive' } },
                  { title: { contains: q, mode: 'insensitive' } },
                ],
              },
              take: 15,
              orderBy: { name: 'asc' },
            })
          : Promise.resolve([]),
      ]);

      return {
        scope: effectiveScope,
        messages: messages.map((m) => ({
          id: m.id,
          content: m.content,
          senderId: m.senderId,
          senderName: m.sender.name,
          senderAvatar: m.sender.avatarUrl ?? undefined,
          channelId: m.channelId ?? undefined,
          channelName: m.channel?.name ?? undefined,
          conversationId: m.conversationId ?? undefined,
          createdAt: m.createdAt.toISOString(),
          reactions: [],
          updatedAt: m.updatedAt.toISOString(),
        })),
        channels: channels.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description ?? undefined,
          type: c.type.toLowerCase(),
          membersCount: undefined,
        })),
        users: users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          avatarUrl: u.avatarUrl ?? undefined,
          title: u.title ?? undefined,
          status: u.status.toLowerCase() as 'online' | 'busy' | 'away' | 'offline',
          workplaceId: u.workplaceId,
          createdAt: u.createdAt.toISOString(),
        })),
      };
    } catch (error) {
      throwInternal('Failed to search', error);
    }
  }
}
