import type { OperationContext } from "../../operations/types";
import { canView } from "../../shared/can-view";

export type EndpointLastReceivedInput = {
  context: Pick<OperationContext, "db" | "permissions">;
  endpointIds: readonly string[];
};

/**
 * When each endpoint's newest message arrived, in one grouped read. It comes from the inbox's
 * messages, so it is only looked up for a caller with `inbox:read` (ADR 0071); else empty.
 */
export async function endpointLastReceived({
  context,
  endpointIds,
}: EndpointLastReceivedInput): Promise<Map<string, Date>> {
  if (endpointIds.length === 0 || !canView({ context, feature: "inbox" })) return new Map();
  const rows = await context.db.inboundMessage.groupBy({
    by: ["endpointId"],
    where: { endpointId: { in: [...endpointIds] } },
    _max: { receivedAt: true },
  });
  const pairs = rows.flatMap((row) =>
    row.endpointId && row._max.receivedAt ? [[row.endpointId, row._max.receivedAt] as const] : [],
  );
  return new Map(pairs);
}
