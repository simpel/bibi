import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { applyLineState } from "../line/line-state";
import type { LineRecord } from "../line/schema";
import { LINE_INCLUDE, toLineRecord } from "../line/to-line-record";
import { withEffective } from "../line/with-effective";
import { TicketExpireHoldsInputSchema, TicketExpireHoldsOutputSchema } from "./schema";

type Db = { context: Pick<OperationContext, "db"> };

/** Active lines in an expiring state on active tickets whose `holdsUntil` has passed. */
const loadDueLines = ({ context }: Db) =>
  context.db.line.findMany({
    where: {
      ticket: { status: "ACTIVE", holdsUntil: { lte: new Date() } },
      state: { status: "ACTIVE", expires: true },
    },
    include: {
      item: { select: { entityType: { select: { expiryStateId: true } } } },
      ...LINE_INCLUDE,
    },
    orderBy: [{ ticketId: "asc" }, { id: "asc" }],
  });

type ClaimInput = Db & { id: string; stateId: string };

/**
 * Locks the line and confirms it is still in the state it was loaded in, so two concurrent runs
 * never expire one line twice: the second waits for the first and then finds nothing to do. It
 * touches only `updatedAt`: the state changes through the history (ADR 0054).
 */
async function claim({ context, id, stateId }: ClaimInput): Promise<boolean> {
  const claimed = await context.db.line.updateMany({
    where: { id, stateId },
    data: { updatedAt: new Date() },
  });
  return claimed.count > 0;
}

export const expireTicketHolds = defineOperation({
  name: "ticket.expireHolds",
  kind: "command",
  description:
    "Expire the soft holds of every ticket whose holdsUntil date has passed (ADR 0044): each " +
    "line in a state that expires moves to its item type's expiry state and its hold follows. " +
    "Booked or ordered lines and the ticket's status are unchanged; a type without an expiry " +
    "state keeps its lines. Runs every 15 minutes in the scheduler and can be run by hand. " +
    "Returns the lines that expired.",
  input: TicketExpireHoldsInputSchema,
  output: TicketExpireHoldsOutputSchema,
  permission: "program:write",
  entityType: "line",
  handler: async ({ context }) => {
    const items: LineRecord[] = [];
    for (const { item, ...row } of await loadDueLines({ context })) {
      const target = item?.entityType.expiryStateId;
      if (!target || !row.stateId || target === row.stateId) continue;
      if (!(await claim({ context, id: row.id, stateId: row.stateId }))) continue;
      const before = toLineRecord({ row });
      const moved = await applyLineState({ context, before, stateId: target, trigger: "EXPIRY" });
      if (!moved.ok) return moved;
      items.push(moved.value);
    }
    return ok({ value: { items: await withEffective({ context, lines: items }) } });
  },
});
