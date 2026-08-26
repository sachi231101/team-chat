import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ChannelType, ChannelMemberRole } from '@prisma/client';
import { ChatAccessService } from './chat-access.service';
import { RequestUser } from './request-user';

describe('ChatAccessService (Workplace Isolation & Resource Authorization)', () => {
  let prismaMock: any;
  let service: ChatAccessService;

  const userAlpha: RequestUser = {
    userId: 'usr-alice',
    id: 'usr-alice',
    workplaceId: 'wp-alpha',
    role: 'member',
    permissions: ['chat:read', 'chat:write'],
  };

  const adminAlpha: RequestUser = {
    userId: 'usr-admin-alpha',
    id: 'usr-admin-alpha',
    workplaceId: 'wp-alpha',
    role: 'admin',
    permissions: ['chat:read', 'chat:write', 'admin'],
  };

  const userBeta: RequestUser = {
    userId: 'usr-bob',
    id: 'usr-bob',
    workplaceId: 'wp-beta',
    role: 'member',
    permissions: ['chat:read', 'chat:write'],
  };

  beforeEach(() => {
    prismaMock = {
      channel: { findUnique: jest.fn() },
      channelMember: { findUnique: jest.fn(), findFirst: jest.fn() },
      conversation: { findUnique: jest.fn() },
      conversationParticipant: { findUnique: jest.fn() },
      message: { findUnique: jest.fn() },
      attachment: { findFirst: jest.fn(), findUnique: jest.fn() },
      user: { findMany: jest.fn(), count: jest.fn() },
    };
    service = new ChatAccessService(prismaMock);
  });

  describe('assertChannelAccess', () => {
    it('allows access to a PUBLIC channel in the SAME workplace', async () => {
      prismaMock.channel.findUnique.mockResolvedValue({
        id: 'chn-general',
        name: 'general',
        type: ChannelType.PUBLIC,
        workplaceId: 'wp-alpha',
        members: [],
      });

      const result = await service.assertChannelAccess(userAlpha, 'chn-general');
      expect(result.id).toBe('chn-general');
    });

    it('DENIES access to a channel from a DIFFERENT workplace (Multi-tenant cross-workplace isolation)', async () => {
      prismaMock.channel.findUnique.mockResolvedValue({
        id: 'chn-general',
        name: 'general',
        type: ChannelType.PUBLIC,
        workplaceId: 'wp-alpha',
        members: [],
      });

      await expect(service.assertChannelAccess(userBeta, 'chn-general')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('allows access to a PRIVATE channel if user is a member in the SAME workplace', async () => {
      prismaMock.channel.findUnique.mockResolvedValue({
        id: 'chn-secret',
        name: 'secret',
        type: ChannelType.PRIVATE,
        workplaceId: 'wp-alpha',
        members: [{ channelId: 'chn-secret', userId: 'usr-alice', role: 'MEMBER' }],
      });

      const result = await service.assertChannelAccess(userAlpha, 'chn-secret');
      expect(result.id).toBe('chn-secret');
    });

    it('DENIES access (403 Forbidden) to a PRIVATE channel if user is NOT a member', async () => {
      prismaMock.channel.findUnique.mockResolvedValue({
        id: 'chn-secret',
        name: 'secret',
        type: ChannelType.PRIVATE,
        workplaceId: 'wp-alpha',
        members: [{ channelId: 'chn-secret', userId: 'usr-other', role: 'MEMBER' }],
      });

      await expect(service.assertChannelAccess(userAlpha, 'chn-secret')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });

  describe('assertConversationAccess', () => {
    it('allows access to DM/group conversation if user is a participant in the SAME workplace', async () => {
      prismaMock.conversation.findUnique.mockResolvedValue({
        id: 'conv-1',
        workplaceId: 'wp-alpha',
        participants: [{ conversationId: 'conv-1', userId: 'usr-alice' }],
      });

      const result = await service.assertConversationAccess(userAlpha, 'conv-1');
      expect(result.id).toBe('conv-1');
    });

    it('DENIES access to a conversation in a DIFFERENT workplace', async () => {
      prismaMock.conversation.findUnique.mockResolvedValue({
        id: 'conv-1',
        workplaceId: 'wp-alpha',
        participants: [{ conversationId: 'conv-1', userId: 'usr-alice' }],
      });

      await expect(service.assertConversationAccess(userBeta, 'conv-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('DENIES access (403 Forbidden) to conversation if user is NOT a participant', async () => {
      prismaMock.conversation.findUnique.mockResolvedValue({
        id: 'conv-1',
        workplaceId: 'wp-alpha',
        participants: [{ conversationId: 'conv-1', userId: 'usr-other' }],
      });

      await expect(service.assertConversationAccess(userAlpha, 'conv-1')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });

  describe('assertMessageModifyAccess (Edit & Delete)', () => {
    it('allows author to EDIT their own message', async () => {
      prismaMock.message.findUnique.mockResolvedValue({
        id: 'msg-1',
        senderId: 'usr-alice',
        channelId: 'chn-general',
        deletedAt: null,
      });
      prismaMock.channel.findUnique.mockResolvedValue({
        id: 'chn-general',
        workplaceId: 'wp-alpha',
        type: ChannelType.PUBLIC,
        members: [],
      });

      const result = await service.assertMessageModifyAccess(userAlpha, 'msg-1', undefined, false);
      expect(result.id).toBe('msg-1');
    });

    it('DENIES non-author from EDITING another user message (403 Forbidden)', async () => {
      prismaMock.message.findUnique.mockResolvedValue({
        id: 'msg-1',
        senderId: 'usr-charlie',
        channelId: 'chn-general',
        deletedAt: null,
      });
      prismaMock.channel.findUnique.mockResolvedValue({
        id: 'chn-general',
        workplaceId: 'wp-alpha',
        type: ChannelType.PUBLIC,
        members: [],
      });

      await expect(
        service.assertMessageModifyAccess(userAlpha, 'msg-1', undefined, false),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('allows channel admin to DELETE another user message in the same workplace', async () => {
      prismaMock.message.findUnique.mockResolvedValue({
        id: 'msg-1',
        senderId: 'usr-charlie',
        channelId: 'chn-general',
        deletedAt: null,
      });
      prismaMock.channel.findUnique.mockResolvedValue({
        id: 'chn-general',
        workplaceId: 'wp-alpha',
        type: ChannelType.PUBLIC,
        members: [],
      });
      prismaMock.channelMember.findUnique.mockResolvedValue({
        channelId: 'chn-general',
        userId: 'usr-admin-alpha',
        role: ChannelMemberRole.ADMIN,
      });

      const result = await service.assertMessageModifyAccess(adminAlpha, 'msg-1', undefined, true);
      expect(result.id).toBe('msg-1');
    });

    it('DENIES regular non-author from DELETING another user message (403 Forbidden)', async () => {
      prismaMock.message.findUnique.mockResolvedValue({
        id: 'msg-1',
        senderId: 'usr-charlie',
        channelId: 'chn-general',
        deletedAt: null,
      });
      prismaMock.channel.findUnique.mockResolvedValue({
        id: 'chn-general',
        workplaceId: 'wp-alpha',
        type: ChannelType.PUBLIC,
        members: [],
      });
      prismaMock.channelMember.findUnique.mockResolvedValue({
        channelId: 'chn-general',
        userId: 'usr-alice',
        role: ChannelMemberRole.MEMBER,
      });

      await expect(
        service.assertMessageModifyAccess(userAlpha, 'msg-1', undefined, true),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('assertUsersBelongToWorkplace', () => {
    it('allows when all target users belong to caller workplace', async () => {
      prismaMock.user.count.mockResolvedValue(2);

      await expect(
        service.assertUsersBelongToWorkplace('wp-alpha', ['usr-alice', 'usr-david']),
      ).resolves.not.toThrow();
    });

    it('REJECTS (400 BadRequest) when target user belongs to a DIFFERENT workplace', async () => {
      prismaMock.user.count.mockResolvedValue(1); // usr-bob missing from wp-alpha

      await expect(
        service.assertUsersBelongToWorkplace('wp-alpha', ['usr-alice', 'usr-bob']),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('assertAttachmentAccess', () => {
    it('allows attachment access if parent message is in user accessible channel', async () => {
      prismaMock.attachment.findFirst.mockResolvedValue({
        id: 'att-1',
        message: {
          id: 'msg-1',
          channelId: 'chn-general',
          deletedAt: null,
        },
      });
      prismaMock.message.findUnique.mockResolvedValue({
        id: 'msg-1',
        channelId: 'chn-general',
        deletedAt: null,
      });
      prismaMock.channel.findUnique.mockResolvedValue({
        id: 'chn-general',
        workplaceId: 'wp-alpha',
        type: ChannelType.PUBLIC,
        members: [],
      });

      const result = await service.assertAttachmentAccess(userAlpha, 'att-1');
      expect(result.id).toBe('att-1');
    });

    it('DENIES attachment access if user is from a DIFFERENT workplace', async () => {
      prismaMock.attachment.findFirst.mockResolvedValue({
        id: 'att-1',
        message: {
          id: 'msg-1',
          channelId: 'chn-general',
          deletedAt: null,
        },
      });
      prismaMock.message.findUnique.mockResolvedValue({
        id: 'msg-1',
        channelId: 'chn-general',
        deletedAt: null,
      });
      prismaMock.channel.findUnique.mockResolvedValue({
        id: 'chn-general',
        workplaceId: 'wp-alpha',
        type: ChannelType.PUBLIC,
        members: [],
      });

      await expect(service.assertAttachmentAccess(userBeta, 'att-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('canJoinChannel and canJoinConversation (Socket.IO checks)', () => {
    it('returns true for public channel in same workplace', async () => {
      prismaMock.channel.findUnique.mockResolvedValue({
        id: 'chn-general',
        type: ChannelType.PUBLIC,
        workplaceId: 'wp-alpha',
        members: [],
      });

      const allowed = await service.canJoinChannel(userAlpha, 'chn-general');
      expect(allowed).toBe(true);
    });

    it('returns false for channel in different workplace', async () => {
      prismaMock.channel.findUnique.mockResolvedValue({
        id: 'chn-general',
        type: ChannelType.PUBLIC,
        workplaceId: 'wp-alpha',
        members: [],
      });

      const allowed = await service.canJoinChannel(userBeta, 'chn-general');
      expect(allowed).toBe(false);
    });

    it('returns false for private channel when not a member', async () => {
      prismaMock.channel.findUnique.mockResolvedValue({
        id: 'chn-private',
        type: ChannelType.PRIVATE,
        workplaceId: 'wp-alpha',
        members: [{ channelId: 'chn-private', userId: 'usr-other' }],
      });

      const allowed = await service.canJoinChannel(userAlpha, 'chn-private');
      expect(allowed).toBe(false);
    });
  });
});

