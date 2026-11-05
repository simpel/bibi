import "server-only";
import { getInboundMessage, type InboundMessageDto, type Result } from "@bibi/core";
import { cache } from "react";
import { runOperation } from "@/server/run-operation";

const loadInboundMessageCached = cache(async (id: string): Promise<Result<InboundMessageDto>> => {
  return runOperation({ operation: getInboundMessage, input: { id } });
});

export type LoadInboundMessageInput = { id: string };

/** The inbox message by its id, cached per request so metadata and page components share one read. Marking it read is a separate write, never cached. */
export function loadInboundMessage({
  id,
}: LoadInboundMessageInput): Promise<Result<InboundMessageDto>> {
  return loadInboundMessageCached(id);
}
