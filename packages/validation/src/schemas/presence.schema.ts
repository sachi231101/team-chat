import { z } from 'zod';

export const updatePresenceSchema = z.object({
  status: z.enum(['online', 'busy', 'away', 'offline']),
  customStatus: z.string().max(100).optional(),
});

export type UpdatePresenceInput = z.infer<typeof updatePresenceSchema>;
