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
