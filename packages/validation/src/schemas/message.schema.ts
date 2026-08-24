import { z } from 'zod';

export const createMessageSchema = z.object({
  channelId: z.string().optional(),
  conversationId: z.string().optional(),
  content: z.string().min(1, 'Message cannot be empty').max(4000),
  parentMessageId: z.string().optional(),
  attachments: z.array(z.string().url()).optional(),
}).refine(data => Boolean(data.channelId || data.conversationId), {
  message: 'Either channelId or conversationId must be provided',
});

export const addReactionSchema = z.object({
  messageId: z.string().min(1),
  emoji: z.string().min(1).max(16),
});

export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type AddReactionInput = z.infer<typeof addReactionSchema>;
