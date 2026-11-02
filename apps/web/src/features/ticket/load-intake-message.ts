import "server-only";
import { getInboundMessage } from "@bibi/core";
import { runOperation } from "@/server/run-operation";
import { senderOf } from "../inbound-message/ui/message-value";
import type { IntakeMessage } from "./intake/intake-message";
import { customerHint } from "./intake/message-hint";

/**
 * The message `?fromMessage=<id>` names, when the caller may read it and it has no ticket yet;
 * otherwise null and the intake starts as usual (`ticket.create` checks it again).
 */
export async function loadIntakeMessage({
  id,
}: {
  id: string | undefined;
}): Promise<IntakeMessage | null> {
  if (!id) return null;
  const result = await runOperation({ operation: getInboundMessage, input: { id } });
  if (!result.ok || result.value.ticketId) return null;
  const message = result.value;
  const sender = senderOf({ message }) ?? message.subject ?? message.id;
  return { id: message.id, sender, search: customerHint({ fromEmail: message.fromEmail }) };
}
