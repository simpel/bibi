import {
  createEntityType,
  type ExecuteContext,
  execute,
  followLineStatus,
  setStatusGridCell,
} from "../src/index";
import { createTypeWithField } from "./customer-helpers";
import { unwrap } from "./helpers";
import { createTestItem } from "./item-helpers";
import { addState, roomStates } from "./item-state-helpers";
import { createTestLine } from "./line-helpers";
import { createBookableItem } from "./occupancy-helpers";
import { createTestTicket, memberUser, ticketSetup } from "./ticket-helpers";
import { statusByName } from "./ticket-status-helpers";

type Ctx = { context: ExecuteContext };

/** A food type with Estimated (initial), Ordered, Locked and Released, and one dish (ADR 0044). */
async function foodSetup({ context }: Ctx) {
  const input = { base: "ITEM" as const, name: "Dish" };
  const type = unwrap({ result: await execute({ operation: createEntityType, input, context }) });
  type Add = { name: string; initial?: boolean; released?: boolean };
  const add = async ({ name, initial = false, released = false }: Add) =>
    unwrap({ result: await addState({ context, entityTypeId: type.id, name, initial, released }) });
  const estimated = await add({ name: "Estimated", initial: true });
  const ordered = await add({ name: "Ordered" });
  const locked = await add({ name: "Locked" });
  const released = await add({ name: "Released", released: true });
  const dish = await createTestItem({ context, entityTypeId: type.id, name: "Fish stew" });
  return { type, dish, estimated, ordered, locked, released };
}

/**
 * The default statuses (Lead, Confirmed, Completed, Lost), a line type, a room with the bookable
 * states (Prebooked, Booked, Released) and a dish with the food states. `newTicket` makes a
 * ticket in Lead, assigned unless told otherwise.
 */
export async function gridSetup() {
  const { context, type: ticketType, customer } = await ticketSetup();
  const assigneeId = await memberUser({ context, name: "Johan Ek" });
  const newTicket = ({ assigned = true }: { assigned?: boolean } = {}) =>
    createTestTicket({
      context,
      entityTypeId: ticketType.id,
      customerId: customer.id,
      ...(assigned ? { assigneeId } : {}),
    });
  const { type: lineType } = await createTypeWithField({
    context,
    base: "LINE",
    name: "Line",
  });
  const room = await createBookableItem({ context });
  const roomState = await roomStates({ context, entityTypeId: room.entityTypeId });
  const food = await foodSetup({ context });
  return { context, newTicket, lineType, room, roomState, food };
}

export type GridSetup = Awaited<ReturnType<typeof gridSetup>>;

export type SetCellInput = Ctx & {
  ticketStatus: string;
  entityTypeId: string;
  stateId: string | null;
};

/** `statusGrid.setCell` on the named status; returns the result. */
export async function setCell({ context, ticketStatus, entityTypeId, stateId }: SetCellInput) {
  const { id: statusId } = await statusByName({ context, name: ticketStatus });
  const input = { statusId, entityTypeId, stateId };
  return execute({ operation: setStatusGridCell, input, context });
}

export type AddLineInput = { setup: GridSetup; ticketId: string; itemId: string; from?: number };

/** A line on the item from `from` (default 9) for two hours on 1 November 2026. */
export async function addLine({ setup, ticketId, itemId, from = 9 }: AddLineInput) {
  const { context, lineType } = setup;
  const input = { context, ticketId, entityTypeId: lineType.id, itemId, from, to: from + 2 };
  return unwrap({ result: await createTestLine(input) });
}

export type LineInput = Ctx & { lineId: string };

/** The line as stored now. */
export const lineNow = ({ context, lineId }: LineInput) =>
  context.db.line.findFirstOrThrow({ where: { id: lineId } });

/** `line.followStatus`; returns the result. */
export const follow = ({ context, lineId }: LineInput) =>
  execute({ operation: followLineStatus, input: { lineId }, context });
