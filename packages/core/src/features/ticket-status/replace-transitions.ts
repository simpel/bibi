import type { OperationContext } from "../../operations/types";
import type { TicketStatusDto } from "./schema";

export type ReplaceTransitionsInput = {
  context: Pick<OperationContext, "db" | "organizationId">;
  before: TicketStatusDto;
  /** Null = free movement; otherwise the only statuses a ticket may move to from `before`. */
  targets: readonly string[] | null;
};

/**
 * Sets what a status allows next (ADR 0076): the `restrictsNext` flag and, while restricted, the
 * list of targets as one replaced set. A free status keeps no list, so the flag is the only truth.
 */
export async function replaceTransitions({ context, before, targets }: ReplaceTransitionsInput) {
  const { organizationId } = context;
  await context.db.ticketStatusTransition.deleteMany({ where: { fromStatusId: before.id } });
  await context.db.ticketStatus.update({
    where: { id: before.id },
    data: { restrictsNext: targets !== null },
  });
  for (const toStatusId of targets ?? []) {
    const data = { organizationId, fromStatusId: before.id, toStatusId };
    await context.db.ticketStatusTransition.create({ data });
  }
}
