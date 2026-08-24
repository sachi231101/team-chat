import { z } from 'zod';
export declare const createChannelSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    topic: z.ZodOptional<z.ZodString>;
    type: z.ZodDefault<z.ZodEnum<["public", "private"]>>;
    workplaceId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    type: "public" | "private";
    workplaceId: string;
    description?: string | undefined;
    topic?: string | undefined;
}, {
    name: string;
    workplaceId: string;
    description?: string | undefined;
    topic?: string | undefined;
    type?: "public" | "private" | undefined;
}>;
export declare const updateChannelSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    topic: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    type: z.ZodOptional<z.ZodDefault<z.ZodEnum<["public", "private"]>>>;
    workplaceId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    topic?: string | undefined;
    type?: "public" | "private" | undefined;
    workplaceId?: string | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    topic?: string | undefined;
    type?: "public" | "private" | undefined;
    workplaceId?: string | undefined;
}>;
export type CreateChannelInput = z.infer<typeof createChannelSchema>;
export type UpdateChannelInput = z.infer<typeof updateChannelSchema>;
