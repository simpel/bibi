import type { OperationContext } from "../../operations/types";
import type { TransitionGate } from "./gate-schema";

export type CreateTransitionInput = {
  context: Pick<OperationContext, "db" | "organizationId">;
  fromStatusId: string;
  toStatusId: string;
  gates: readonly TransitionGate[];
};

/** One transition and its gates (two writes: the scoped client allows no nested writes). */
export async function createTransition({ context, gates, ...ids }: CreateTransitionInput) {
  const { organizationId } = context;
  const row = await context.db.ticketStatusTransition.create({ data: { organizationId, ...ids } });
  if (gates.length === 0) return;
  await context.db.ticketStatusTransitionGate.createMany({
    data: gates.map((key) => ({ organizationId, transitionId: row.id, key })),
  });
}
