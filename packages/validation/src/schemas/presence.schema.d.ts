import { z } from 'zod';
export declare const updatePresenceSchema: z.ZodObject<{
    status: z.ZodEnum<["online", "busy", "away", "offline"]>;
    customStatus: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "online" | "busy" | "away" | "offline";
    customStatus?: string | undefined;
}, {
    status: "online" | "busy" | "away" | "offline";
    customStatus?: string | undefined;
}>;
export type UpdatePresenceInput = z.infer<typeof updatePresenceSchema>;
