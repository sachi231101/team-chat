import { z } from 'zod';

export const createChannelSchema = z.object({
  name: z.string().min(1, 'Channel name is required').max(80).regex(/^[a-z0-9-_]+$/, 'Channel name must be lower case letters, numbers, hyphens or underscores'),
  description: z.string().max(250).optional(),
  topic: z.string().max(250).optional(),
  type: z.enum(['public', 'private']).default('public'),
  workplaceId: z.string().min(1),
});

export const updateChannelSchema = createChannelSchema.partial();

export type CreateChannelInput = z.infer<typeof createChannelSchema>;
export type UpdateChannelInput = z.infer<typeof updateChannelSchema>;
