import "server-only";
import { DRAFT_TEXT_MAX, getInboundMessage } from "@bibi/core";
import { runOperation } from "@/server/run-operation";
import { senderOf } from "../inbound-message/ui/message-value";
import type { IntakeMessage } from "./intake/intake-message";
import { customerHint } from "./intake/message-hint";

/**
 * The message `?fromMessage=<id>` names, when the caller may read it and it has no order yet;
 * otherwise null and the intake starts as usual (`order.create` checks it again).
 */
export async function loadIntakeMessage({
  id,
}: {
  id: string | undefined;
}): Promise<IntakeMessage | null> {
  if (!id) return null;
  const result = await runOperation({ operation: getInboundMessage, input: { id } });
  if (!result.ok || result.value.orderId) return null;
  const message = result.value;
  const sender = senderOf({ message }) ?? message.subject ?? message.id;
  const search = customerHint({ fromEmail: message.fromEmail });
  return { id: message.id, sender, search, text: message.text.trim().slice(0, DRAFT_TEXT_MAX) };
}
