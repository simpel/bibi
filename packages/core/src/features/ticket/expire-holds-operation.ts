import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { applyLineState } from "../program-item/line-state";
import type { ProgramItemDto } from "../program-item/schema";
import { toProgramItemDto } from "../program-item/to-program-item-dto";
import { TicketExpireHoldsInputSchema, TicketExpireHoldsOutputSchema } from "./schema";

type Db = { context: Pick<OperationContext, "db"> };

/** Active lines in an expiring state on active tickets whose `holdsUntil` has passed. */
const loadDueLines = ({ context }: Db) =>
  context.db.programItem.findMany({
    where: {
      ticket: { status: "ACTIVE", holdsUntil: { lte: new Date() } },
      state: { status: "ACTIVE", expires: true },
    },
    include: { item: { select: { entityType: { select: { expiryStateId: true } } } } },
    orderBy: [{ ticketId: "asc" }, { id: "asc" }],
  });

type ClaimInput = Db & { id: string; stateId: string };

/**
 * Locks the line and confirms it is still in the state it was loaded in, so two concurrent runs
 * never expire one line twice: the second waits for the first and then finds nothing to do.
 */
async function claim({ context, id, stateId }: ClaimInput): Promise<boolean> {
  const claimed = await context.db.programItem.updateMany({
    where: { id, stateId },
    data: { stateId },
  });
  return claimed.count > 0;
}

export const expireTicketHolds = defineOperation({
  name: "ticket.expireHolds",
  kind: "command",
  description:
    "Expire the soft holds of every ticket whose holdsUntil date has passed (ADR 0044): each " +
    "line in a state that expires moves to its item type's expiry state and its hold follows. " +
    "Booked or ordered lines and the ticket's phase are unchanged; a type without an expiry " +
    "state keeps its lines. Runs every 15 minutes in the scheduler and can be run by hand. " +
    "Returns the lines that expired.",
  input: TicketExpireHoldsInputSchema,
  output: TicketExpireHoldsOutputSchema,
  permission: "program:write",
  entityType: "programItem",
  handler: async ({ context }) => {
    const items: ProgramItemDto[] = [];
    for (const { item, ...row } of await loadDueLines({ context })) {
      const target = item?.entityType.expiryStateId;
      if (!target || !row.stateId || target === row.stateId) continue;
      if (!(await claim({ context, id: row.id, stateId: row.stateId }))) continue;
      const before = toProgramItemDto({ row });
      const moved = await applyLineState({ context, before, stateId: target });
      if (!moved.ok) return moved;
      items.push(moved.value);
    }
    return ok({ value: { items } });
  },
});
