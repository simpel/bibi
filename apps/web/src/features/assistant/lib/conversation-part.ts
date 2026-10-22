import { z } from "zod";

const ConversationPartSchema = z.object({
  type: z.literal("data-bibi-conversation"),
  data: z.object({ conversationId: z.string().min(1), created: z.boolean().optional() }),
});

export type ReadConversationIdInput = { part: unknown };

/** Conversation id from the transient `data-bibi-conversation` stream part, if that is it. */
export function readConversationId({ part }: ReadConversationIdInput): string | null {
  const parsed = ConversationPartSchema.safeParse(part);
  return parsed.success ? parsed.data.data.conversationId : null;
}
