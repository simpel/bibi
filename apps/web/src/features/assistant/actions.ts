"use server";

import {
  archiveConversation,
  listConversations,
  listMessages,
  type MessageDto,
  renameConversation,
} from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";
import { type StoredConversation, toStoredConversation } from "./lib/stored-messages";

/** A conversation as the history list shows it. */
export type ConversationSummary = { id: string; title: string; updatedAt: string };

const MAX_PAGES = 5;

/** The user's own active conversations, newest activity first (first page of 100). */
export async function listConversationsAction(): Promise<ActionResult<ConversationSummary[]>> {
  const result = await runOperation({ operation: listConversations, input: { limit: 100 } });
  if (!result.ok) return toActionResult({ result });
  const items = result.value.items.map(({ id, title, updatedAt }) => ({
    id,
    title,
    updatedAt: updatedAt.toISOString(),
  }));
  return toActionResult({ result: { ok: true, value: items } });
}

export type ConversationIdInput = { id: string };

/** All messages of a conversation (oldest first, capped) shaped for `useChat`. */
export async function loadConversationAction({
  id,
}: ConversationIdInput): Promise<ActionResult<StoredConversation>> {
  const all: MessageDto[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    const input = { conversationId: id, limit: 200, ...(cursor ? { cursor } : {}) };
    const result = await runOperation({ operation: listMessages, input });
    if (!result.ok) return toActionResult({ result });
    all.push(...result.value.items);
    cursor = result.value.nextCursor ?? undefined;
    if (!cursor) break;
  }
  return toActionResult({ result: { ok: true, value: toStoredConversation({ messages: all }) } });
}

export type RenameConversationInput = { id: string; title: string };

export async function renameConversationAction({
  id,
  title,
}: RenameConversationInput): Promise<ActionResult<ConversationSummary>> {
  const result = await runOperation({ operation: renameConversation, input: { id, title } });
  if (!result.ok) return toActionResult({ result });
  const { updatedAt } = result.value;
  const value = { id, title: result.value.title, updatedAt: updatedAt.toISOString() };
  return toActionResult({ result: { ok: true, value } });
}

export async function archiveConversationAction({
  id,
}: ConversationIdInput): Promise<ActionResult<{ id: string }>> {
  const result = await runOperation({ operation: archiveConversation, input: { id } });
  return toActionResult({
    result: result.ok ? { ok: true, value: { id } } : result,
  });
}
