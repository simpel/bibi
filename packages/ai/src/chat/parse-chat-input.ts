import { AppError, err, ok, type Result } from "@okazi/core";
import type { AssistantLocale, PageContext } from "../prompt/page-context-schema";
import { readJsonBody } from "../server/read-json-body";
import { ASSISTANT_LIMITS } from "./assistant-limits";
import { ChatRequestSchema, userText } from "./chat-request";

export type ChatInput = {
  conversationId?: string;
  /** Text of the new user message. */
  text: string;
  clientMessageId: string;
  page?: PageContext;
  locale: AssistantLocale;
};

const invalid = ({ message }: { message: string }) =>
  err({ error: new AppError({ code: "VALIDATION", message }) });

/** Validated request: the last message must be the user's, with text within the limit. */
export async function parseChatInput({ request }: { request: Request }): Promise<Result<ChatInput>> {
  const body = await readJsonBody({ request, schema: ChatRequestSchema });
  if (!body.ok) return body;
  const { conversationId, messages, pageContext } = body.value;
  const last = messages.at(-1);
  if (!last || last.role !== "user") return invalid({ message: "The last message must be the user's" });
  const text = userText({ message: last });
  if (text === "") return invalid({ message: "The user message has no text" });
  if (text.length > ASSISTANT_LIMITS.maxUserTextChars) return invalid({ message: "The user message is too long" });
  return ok({
    value: {
      text,
      clientMessageId: last.id,
      locale: pageContext?.locale ?? "sv",
      ...(conversationId ? { conversationId } : {}),
      ...(pageContext ? { page: pageContext } : {}),
    },
  });
}
