import { type EmbedFn, listMessages, type MessageDto, ok, type Result } from "@okazi/core";
import type { UIMessage } from "ai";
import type { UserContext } from "../server/resolve-user";
import { runCore } from "../server/run-core";
import { ASSISTANT_LIMITS } from "./assistant-limits";

const PAGE = 200;
const MAX_PAGES = 25;

export type LoadHistoryInput = { user: UserContext; embed: EmbedFn; conversationId: string };

/** Stored messages, oldest first (all pages, capped). */
async function loadAll({
  user,
  embed,
  conversationId,
}: LoadHistoryInput): Promise<Result<MessageDto[]>> {
  const all: MessageDto[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    const input = { conversationId, limit: PAGE, ...(cursor ? { cursor } : {}) };
    const result = await runCore({ operation: listMessages, input, context: user, embed });
    if (!result.ok) return result;
    all.push(...result.value.items);
    if (!result.value.nextCursor) break;
    cursor = result.value.nextCursor;
  }
  return ok({ value: all });
}

const textOnly = ({ message }: { message: MessageDto }) =>
  message.parts.flatMap((part) =>
    part.type === "text" && part.text ? [{ type: "text" as const, text: part.text }] : [],
  );

type ToUiInput = { message: MessageDto };

/**
 * DB → model history. ASSISTANT keeps its parts (text + tool calls/results); USER keeps text;
 * TOOL notes (approval decisions, written by the app as the user) become user text; SYSTEM is
 * dropped (the system prompt is rebuilt each run).
 */
function toUiMessage({ message }: ToUiInput): UIMessage | null {
  const id = message.id;
  if (message.role === "ASSISTANT")
    return { id, role: "assistant", parts: message.parts as UIMessage["parts"] };
  if (message.role === "SYSTEM") return null;
  const parts = textOnly({ message });
  return parts.length > 0 ? { id, role: "user", parts } : null;
}

/** The last `maxHistoryMessages` turns of the conversation, as AI SDK UI messages. */
export async function loadHistory({
  user,
  embed,
  conversationId,
}: LoadHistoryInput): Promise<Result<UIMessage[]>> {
  const all = await loadAll({ user, embed, conversationId });
  if (!all.ok) return all;
  const recent = all.value.slice(-ASSISTANT_LIMITS.maxHistoryMessages);
  return ok({ value: recent.flatMap((message) => toUiMessage({ message }) ?? []) });
}
