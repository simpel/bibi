import { createLine, type ExecuteContext, execute, updateItemState } from "../src/index";
import { createTestCustomer, createTypeWithField } from "./customer-helpers";
import { unwrap } from "./helpers";
import { addState } from "./item-state-helpers";
import { hours } from "./occupancy-helpers";
import { createTestTicket } from "./ticket-helpers";

type Ctx = { context: ExecuteContext };

export type HoldLineInput = Ctx & {
  itemId: string;
  /** A hard hold blocks, a soft hold may overlap (ADR 0044). */
  hold: "HARD" | "SOFT";
  from: number;
  to: number;
};

/** The organization's ticket or line type for hold tests, created once. */
async function typeOf({ context, base }: Ctx & { base: "TICKET" | "LINE" }) {
  const name = `Hold ${base.toLowerCase()}`;
  const found = await context.db.entityType.findFirst({ where: { base, name } });
  return found ?? (await createTypeWithField({ context, base, name })).type;
}

/** Makes a state of the item type with the given hold the initial one, creating it if needed. */
async function initialWithHold({ context, entityTypeId, hold }: Ctx & HoldKindOf) {
  const found = await context.db.itemState.findFirst({ where: { entityTypeId, hold } });
  if (!found) {
    const input = { entityTypeId, name: `${hold} hold`, hold, initial: true };
    return unwrap({ result: await addState({ context, ...input }) });
  }
  if (found.initial) return found;
  const input = { id: found.id, initial: true };
  return unwrap({ result: await execute({ operation: updateItemState, input, context }) });
}

type HoldKindOf = { entityTypeId: string; hold: HoldLineInput["hold"] };

/**
 * A line of a fresh ticket on the item for `[from, to)` on 1 November 2026, in a state of the
 * given hold; its `HOLD` follows by trigger (ADR 0053). Needs a provisioned organization
 * (`ticketSetup`). Returns the `line.create` result.
 */
export async function createHoldLine({ context, itemId, hold, from, to }: HoldLineInput) {
  const item = await context.db.item.findFirstOrThrow({ where: { id: itemId } });
  await initialWithHold({ context, entityTypeId: item.entityTypeId, hold });
  const ticketType = await typeOf({ context, base: "TICKET" });
  const lineType = await typeOf({ context, base: "LINE" });
  const customer = await createTestCustomer({ context, name: `Hold ${hold} ${from}-${to}` });
  const ticket = await createTestTicket({
    context,
    entityTypeId: ticketType.id,
    customerId: customer.id,
  });
  const input = { ticketId: ticket.id, entityTypeId: lineType.id, itemId, name: "Hold" };
  return execute({ operation: createLine, input: { ...input, ...hours({ from, to }) }, context });
}

/** `createHoldLine`, then the line's active `HOLD` row. */
export async function insertHold({ ...input }: HoldLineInput) {
  const line = unwrap({ result: await createHoldLine(input) });
  return input.context.db.occupancy.findFirstOrThrow({
    where: { lineId: line.id, type: "HOLD" },
  });
}
