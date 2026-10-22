import { createConversation, type EmbedFn, getConversation, ok, type Result } from "@bibi/core";
import type { UserContext } from "../server/resolve-user";
import { runCore } from "../server/run-core";
import { ASSISTANT_LIMITS } from "./assistant-limits";

export type ConversationTitleInput = { text: string };

/** First line of the first user message, whitespace-collapsed and truncated. */
export function conversationTitle({ text }: ConversationTitleInput): string {
  const line = text.split("\n").find((value) => value.trim() !== "") ?? "";
  const collapsed = line.replace(/\s+/g, " ").trim();
  if (collapsed.length <= ASSISTANT_LIMITS.titleChars) return collapsed || "New conversation";
  return `${collapsed.slice(0, ASSISTANT_LIMITS.titleChars - 1).trimEnd()}…`;
}

export type EnsureConversationInput = {
  user: UserContext;
  embed: EmbedFn;
  conversationId?: string;
  firstText: string;
};

/** Existing conversation (core checks access → NOT_FOUND) or a new one owned by the user. */
export async function ensureConversation({
  user,
  embed,
  conversationId,
  firstText,
}: EnsureConversationInput): Promise<Result<{ id: string; created: boolean }>> {
  if (conversationId) {
    const found = await runCore({
      operation: getConversation,
      input: { id: conversationId },
      context: user,
      embed,
    });
    return found.ok ? ok({ value: { id: found.value.id, created: false } }) : found;
  }
  const title = conversationTitle({ text: firstText });
  const created = await runCore({
    operation: createConversation,
    input: { title },
    context: user,
    embed,
  });
  return created.ok ? ok({ value: { id: created.value.id, created: true } }) : created;
}
