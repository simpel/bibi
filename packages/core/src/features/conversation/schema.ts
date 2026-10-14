import { z } from "zod";

export const ConversationStatusSchema = z.enum(["ACTIVE", "ARCHIVED"]);

export const ConversationSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  ownerUserId: z.string(),
  title: z.string(),
  status: ConversationStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});

const TitleSchema = z.string().trim().min(1).max(200);

export const ConversationCreateInputSchema = z.object({
  title: TitleSchema.default("New conversation").describe("Short title shown in the history"),
});

export const ConversationRenameInputSchema = z.object({
  id: z.string().min(1),
  title: TitleSchema,
});

export const ConversationIdInputSchema = z.object({ id: z.string().min(1) });

export const ConversationListInputSchema = z.object({
  status: ConversationStatusSchema.default("ACTIVE").describe("ACTIVE (default) or ARCHIVED"),
  allUsers: z
    .boolean()
    .default(false)
    .describe("Org admins only: include other users' conversations (default: only your own)"),
  limit: z.number().int().min(1).max(100).default(50),
  cursor: z.string().optional().describe("id of the last item from the previous page"),
});

export const ConversationListOutputSchema = z.object({
  items: z.array(ConversationSchema),
  nextCursor: z.string().nullable(),
});

export type ConversationDto = z.infer<typeof ConversationSchema>;
