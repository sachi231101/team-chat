import { ChannelMemberRole, ChannelType, PrismaClient } from '@prisma/client';

export const DEFAULT_PUBLIC_CHANNELS = [
  {
    name: 'general',
    description: 'Company-wide announcements and discussions.',
    topic: 'Welcome to the workspace',
  },
  {
    name: 'random',
    description: 'Watercooler chat, intros, and off-topic conversation.',
    topic: 'Say hello',
  },
  {
    name: 'announcements',
    description: 'Important team announcements and company news.',
    topic: 'Official updates',
  },
] as const;

/** Create missing default public channels and add a user to every public channel. */
export async function provisionUserPublicChannels(
  prisma: PrismaClient,
  userId: string,
  workplaceId: string,
): Promise<void> {
  const creatorId = userId;

  for (const def of DEFAULT_PUBLIC_CHANNELS) {
    let channel = await prisma.channel.findFirst({
      where: { workplaceId, name: def.name },
    });

    if (!channel) {
      channel = await prisma.channel.create({
        data: {
          name: def.name,
          description: def.description,
          topic: def.topic,
          type: ChannelType.PUBLIC,
          workplaceId,
          createdById: creatorId,
        },
      });
      // #region agent log
      fetch('http://127.0.0.1:7478/ingest/00f10b65-0a04-4e60-b5e9-07d47622c725',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d06bbf'},body:JSON.stringify({sessionId:'d06bbf',runId:'post-fix',hypothesisId:'A',location:'default-channels.ts:create',message:'created missing default channel',data:{name:def.name,channelId:channel.id,userId},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
    }

    await prisma.channelMember.upsert({
      where: { channelId_userId: { channelId: channel.id, userId } },
      create: {
        channelId: channel.id,
        userId,
        role: channel.createdById === userId ? ChannelMemberRole.ADMIN : ChannelMemberRole.MEMBER,
      },
      update: {},
    });
  }

  const publicChannels = await prisma.channel.findMany({
    where: { workplaceId, type: ChannelType.PUBLIC },
    select: { id: true, name: true },
  });

  for (const channel of publicChannels) {
    await prisma.channelMember.upsert({
      where: { channelId_userId: { channelId: channel.id, userId } },
      create: {
        channelId: channel.id,
        userId,
        role: ChannelMemberRole.MEMBER,
      },
      update: {},
    });
  }

  // #region agent log
  fetch('http://127.0.0.1:7478/ingest/00f10b65-0a04-4e60-b5e9-07d47622c725',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d06bbf'},body:JSON.stringify({sessionId:'d06bbf',runId:'post-fix',hypothesisId:'A',location:'default-channels.ts:done',message:'provisioned public channel memberships',data:{userId,workplaceId,channels:publicChannels.map((c)=>c.name)},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
}
