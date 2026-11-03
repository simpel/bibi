import type { OperationContext } from "../../operations/types";
import { type DerivedSlot, derivedSlots } from "./derived-membership";
import type { AssignmentKind } from "./schema";

export type SlotsOfInput = {
  context: Pick<OperationContext, "db">;
  userId: string;
  kind: AssignmentKind;
};

/**
 * The (ticket, responsibility) slots a member answers for or follows (ADR 0055): an explicit
 * choice on the ticket's responsibility, or the responsibility's default when nobody chose
 * otherwise. The main assignment (no responsibility) is not a slot.
 */
export async function slotsOf({ context, userId, kind }: SlotsOfInput): Promise<DerivedSlot[]> {
  const mine =
    kind === "ASSIGNED"
      ? { assigneeId: userId }
      : { followers: { some: { userId, effect: "FOLLOW" as const } } };
  const stored = await context.db.assignment.findMany({
    where: { record: { base: "TICKET" }, responsibilityId: { not: null }, ...mine },
    select: { recordId: true, responsibilityId: true },
  });
  const explicit = stored.flatMap(({ recordId, responsibilityId }) =>
    responsibilityId ? [{ ticketId: recordId, responsibilityId }] : [],
  );
  return [...explicit, ...(await derivedSlots({ context, userId, kind }))];
}
