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
  const realtime = { emitToChat: jest.fn() };
  const mentions = { notifyFromMessage: jest.fn() };
  const service = new MessagesService(prisma as never, realtime as never, mentions as never);

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
    prisma.message.findUnique.mockResolvedValue({
      id: 'msg-1',
      senderId: 'usr-priya',
      deletedAt: null,
    });

    await expect(service.update('msg-1', 'edited', 'usr-rahul')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
