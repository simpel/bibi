"use server";

import {
  attachInboundMessage,
  deleteInboundMessage,
  type InboundMessageDto,
  markInboundMessageRead,
  markInboundMessageUnread,
} from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type AttachMessageActionInput = { input: { id: string; ticketId: string } };
export type MessageIdActionInput = { id: string };

export async function attachMessageAction({
  input,
}: AttachMessageActionInput): Promise<ActionResult<InboundMessageDto>> {
  return toActionResult({ result: await runOperation({ operation: attachInboundMessage, input }) });
}

export async function markMessageReadAction({
  id,
}: MessageIdActionInput): Promise<ActionResult<InboundMessageDto>> {
  const result = await runOperation({ operation: markInboundMessageRead, input: { id } });
  return toActionResult({ result });
}

export async function markMessageUnreadAction({
  id,
}: MessageIdActionInput): Promise<ActionResult<InboundMessageDto>> {
  const result = await runOperation({ operation: markInboundMessageUnread, input: { id } });
  return toActionResult({ result });
}

export async function deleteMessageAction({
  id,
}: MessageIdActionInput): Promise<ActionResult<InboundMessageDto>> {
  const result = await runOperation({ operation: deleteInboundMessage, input: { id } });
  return toActionResult({ result });
}

export type MessageIdsActionInput = { ids: string[] };

/** Runs one message command per id, stopping at the first refusal (bulk bar, several ids). */
async function forEachId({
  ids,
  run,
}: MessageIdsActionInput & {
  run: (input: { id: string }) => Promise<ActionResult<InboundMessageDto>>;
}) {
  for (const id of ids) {
    const result = await run({ id });
    if (!result.ok) return result;
  }
  return { ok: true as const, value: { count: ids.length } };
}

export async function markMessagesAction({
  ids,
  read,
}: MessageIdsActionInput & { read: boolean }): Promise<ActionResult<{ count: number }>> {
  const run = read ? markMessageReadAction : markMessageUnreadAction;
  return forEachId({ ids, run });
}

export async function deleteMessagesAction({
  ids,
}: MessageIdsActionInput): Promise<ActionResult<{ count: number }>> {
  return forEachId({ ids, run: deleteMessageAction });
}
