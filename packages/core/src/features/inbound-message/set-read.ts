import { ok } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { notFound } from "../../shared/errors";
import { nowOf } from "../../time/now";
import { toInboundMessageDto } from "./to-inbound-message-dto";

export type SetReadInput = { context: OperationContext; id: string; read: boolean };

/** Sets or clears the team's shared read state; an unchanged message is returned as is. */
export async function setRead({ context, id, read }: SetReadInput) {
  const before = await context.db.inboundMessage.findFirst({ where: { id } });
  if (!before) return notFound({ entity: "Message" });
  if ((before.readAt !== null) === read) return ok({ value: toInboundMessageDto({ row: before }) });
  const { actor } = context;
  const data = read
    ? { readAt: nowOf({ context }), readBy: actor.userId ?? actor.apiKeyId ?? actor.type }
    : { readAt: null, readBy: null };
  const row = await context.db.inboundMessage.update({ where: { id }, data });
  context.recordChange({
    entityId: id,
    before: { id, readAt: before.readAt, readBy: before.readBy },
    after: { id, ...data },
  });
  return ok({ value: toInboundMessageDto({ row }) });
}
