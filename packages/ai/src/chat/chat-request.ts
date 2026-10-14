import { z } from "zod";
import { PageContextSchema } from "../prompt/page-context-schema";

const UIMessagePartSchema = z.looseObject({ type: z.string().min(1).max(100) });

/** AI SDK `UIMessage` as `useChat` sends it; only the last (user) message is used. */
export const ChatUIMessageSchema = z.object({
  id: z.string().min(1).max(200),
  role: z.enum(["system", "user", "assistant"]),
  parts: z.array(UIMessagePartSchema).max(200),
  metadata: z.unknown().optional(),
});

/**
 * Body of `POST` to the chat endpoint. `messages` follows the AI SDK `useChat` contract, but the
 * server only takes the LAST message (must be the user's) and rebuilds earlier turns from the
 * database, so a client cannot forge assistant/tool history.
 */
export const ChatRequestSchema = z.object({
  conversationId: z.string().min(1).max(200).optional().describe("Omit to start a conversation"),
  messages: z.array(ChatUIMessageSchema).min(1).max(1000),
  pageContext: PageContextSchema.optional(),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;
export type ChatUIMessage = z.infer<typeof ChatUIMessageSchema>;

const TextPartSchema = z.object({ type: z.literal("text"), text: z.string() });

export type UserTextInput = { message: ChatUIMessage };

/** Text of a user message (text parts only; files etc. are not accepted yet). */
export function userText({ message }: UserTextInput): string {
  return message.parts
    .flatMap((part) => {
      const text = TextPartSchema.safeParse(part);
      return text.success ? [text.data.text] : [];
    })
    .join("\n")
    .trim();
}
