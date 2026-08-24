import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ChannelMemberGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const userId =
      req.headers['x-user-id'] || req.body?.senderId || 'usr-rahul';

    // Extract channelId from params, query, or body
    const channelId =
      req.params?.id ||
      req.params?.channelId ||
      req.query?.channelId ||
      req.body?.channelId;

    if (!channelId) {
      return true; // Not a channel-specific request
    }

    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      include: { members: true },
    });

    if (!channel) {
      throw new NotFoundException(`Channel ${channelId} not found`);
    }

    if (channel.type === 'PUBLIC') {
      return true;
    }

    const isMember = channel.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException(
        'Access denied: You are not a member of this private channel',
      );
    }

    return true;
  }
}
