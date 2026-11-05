import { type InboundMessageDto, markInboundMessageRead, type Result } from "@bibi/core";
import { runOperation } from "@/server/run-operation";
import { loadInboundMessage } from "../load-inbound-message";

export type OpenMessageInput = { id: string; canWrite: boolean };

/**
 * Loads a message for its page and marks it read for the team (ADR 0085): opening it is reading
 * it. Without `inbox:write`, or when the mark fails, the message is shown as it is.
 */
export async function openMessage({
  id,
  canWrite,
}: OpenMessageInput): Promise<Result<InboundMessageDto>> {
  const result = await loadInboundMessage({ id });
  if (!result.ok || result.value.readAt !== null || !canWrite) return result;
  const marked = await runOperation({ operation: markInboundMessageRead, input: { id } });
  return marked.ok ? marked : result;
}
