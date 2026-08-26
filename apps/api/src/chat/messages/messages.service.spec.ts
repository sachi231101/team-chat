import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { MessagesService } from './messages.service';

describe('MessagesService', () => {
  const prisma = {
    $transaction: jest.fn(),
    message: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    readReceipt: { findFirst: jest.fn(), upsert: jest.fn() },
  };
  const chatAccess = {
    assertChannelAccess: jest.fn(),
    assertConversationAccess: jest.fn(),
    assertMessageAccess: jest.fn(),
    assertMessageModifyAccess: jest.fn().mockImplementation((user, id, channelId, isDelete) => {
      if (typeof user === 'string' && user !== 'usr-priya') {
        throw new ForbiddenException('You can only edit your own messages');
      }
      if (typeof user === 'object' && user.userId !== 'usr-priya') {
        throw new ForbiddenException('You can only edit your own messages');
      }
      return Promise.resolve({ id, senderId: 'usr-priya' });
    }),
  };
  const realtime = { emitToChat: jest.fn() };
  const mentions = { notifyFromMessage: jest.fn() };
  const ai = { onMessageCreated: jest.fn() };
  const service = new MessagesService(
    prisma as never,
    chatAccess as never,
    realtime as never,
    mentions as never,
    ai as never,
  );

  it('rejects create when both channel and conversation are set', async () => {
    await expect(
      service.create('usr-rahul', {
        content: 'hi',
        channelId: 'chn-1',
        conversationId: 'convo-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects edit from a non-author', async () => {
    await expect(service.update('msg-1', 'edited', 'usr-rahul')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});

