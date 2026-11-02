"use server";

import {
  attachInboundMessage,
  dismissInboundMessage,
  type InboundMessageDto,
  restoreInboundMessage,
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

export async function dismissMessageAction({
  id,
}: MessageIdActionInput): Promise<ActionResult<InboundMessageDto>> {
  const result = await runOperation({ operation: dismissInboundMessage, input: { id } });
  return toActionResult({ result });
}

export async function restoreMessageAction({
  id,
}: MessageIdActionInput): Promise<ActionResult<InboundMessageDto>> {
  const result = await runOperation({ operation: restoreInboundMessage, input: { id } });
  return toActionResult({ result });
}
