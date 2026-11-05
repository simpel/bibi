import type { OperationContext } from "../../operations/types";
import { type DerivedSlot, derivedSlots } from "./derived-membership";
import type { AssignmentKind } from "./schema";

export type SlotsOfInput = {
  context: Pick<OperationContext, "db">;
  userId: string;
  kind: AssignmentKind;
};

/**
 * The (order, responsibility) slots a member answers for or follows (ADR 0055): an explicit
 * choice on the order's responsibility, or the responsibility's default when nobody chose
 * otherwise. The main assignment (no responsibility) is not a slot.
 */
export async function slotsOf({ context, userId, kind }: SlotsOfInput): Promise<DerivedSlot[]> {
  const mine =
    kind === "ASSIGNED"
      ? { assigneeId: userId }
      : { followers: { some: { userId, effect: "FOLLOW" as const } } };
  const stored = await context.db.assignment.findMany({
    where: { record: { base: "ORDER" }, responsibilityId: { not: null }, ...mine },
    select: { recordId: true, responsibilityId: true },
  });
  const explicit = stored.flatMap(({ recordId, responsibilityId }) =>
    responsibilityId ? [{ orderId: recordId, responsibilityId }] : [],
  );
  return [...explicit, ...(await derivedSlots({ context, userId, kind }))];
}
