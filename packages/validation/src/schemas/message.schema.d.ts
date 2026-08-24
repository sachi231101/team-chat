import { z } from 'zod';
export declare const createMessageSchema: z.ZodEffects<z.ZodObject<{
    channelId: z.ZodOptional<z.ZodString>;
    conversationId: z.ZodOptional<z.ZodString>;
    content: z.ZodString;
    parentMessageId: z.ZodOptional<z.ZodString>;
    attachments: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    content: string;
    channelId?: string | undefined;
    conversationId?: string | undefined;
    parentMessageId?: string | undefined;
    attachments?: string[] | undefined;
}, {
    content: string;
    channelId?: string | undefined;
    conversationId?: string | undefined;
    parentMessageId?: string | undefined;
    attachments?: string[] | undefined;
}>, {
    content: string;
    channelId?: string | undefined;
    conversationId?: string | undefined;
    parentMessageId?: string | undefined;
    attachments?: string[] | undefined;
}, {
    content: string;
    channelId?: string | undefined;
    conversationId?: string | undefined;
    parentMessageId?: string | undefined;
    attachments?: string[] | undefined;
}>;
export declare const addReactionSchema: z.ZodObject<{
    messageId: z.ZodString;
    emoji: z.ZodString;
}, "strip", z.ZodTypeAny, {
    messageId: string;
    emoji: string;
}, {
    messageId: string;
    emoji: string;
}>;
export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type AddReactionInput = z.infer<typeof addReactionSchema>;
