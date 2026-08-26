import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: string, userId: string, workplaceId: string = 'wp-teamchat-main') {
    if (!query || !query.trim()) {
      return { messages: [], channels: [], users: [] };
    }
    const q = query.trim();

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

      const [messages, channels, users] = await Promise.all([
        this.prisma.message.findMany({
          where: {
            content: { contains: q, mode: 'insensitive' },
            deletedAt: null,
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
          include: { sender: true, channel: { select: { id: true, name: true } } },
          take: 20,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.channel.findMany({
          where: {
            workplaceId,
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
            ],
            AND: [
              {
                OR: [{ type: 'PUBLIC' }, { id: { in: memberChannelIds } }],
              },
            ],
          },
          take: 20,
        }),
        this.prisma.user.findMany({
          where: {
            workplaceId,
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
            ],
          },
          take: 20,
        }),
      ]);

      return {
        messages: messages.map((m) => ({
          id: m.id,
          content: m.content,
          senderId: m.senderId,
          senderName: m.sender.name,
          senderAvatar: m.sender.avatarUrl ?? undefined,
          channelId: m.channelId ?? undefined,
          channelName: (m as any).channel?.name ?? undefined,
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
        })),
        users: users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          avatarUrl: u.avatarUrl ?? undefined,
          title: u.title ?? undefined,
        })),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to search: ${(error as Error).message}`,
      );
    }
  }
}
