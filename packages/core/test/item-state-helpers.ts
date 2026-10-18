import {
  changeLineState,
  createItemState,
  type ExecuteContext,
  execute,
  type ItemStateCreateInput,
  updateEntityType,
} from "../src/index";
import { unwrap } from "./helpers";

type Ctx = { context: ExecuteContext };

export type AddStateInput = Ctx & Omit<ItemStateCreateInput, "color">;

/** `itemState.create` with a fixed color; returns the result. */
export const addState = ({ context, ...input }: AddStateInput) =>
  execute({ operation: createItemState, input: { color: "#64748b", ...input }, context });

export type RoomStatesInput = Ctx & { entityTypeId: string };

/**
 * The bookable template of ADR 0044 on a room type: Prebooked (soft, expires, initial), Booked
 * (hard, in sheets) and Released (final, the expiry state). The default "Active" stays first.
 */
export async function roomStates({ context, entityTypeId }: RoomStatesInput) {
  const add = async ({ ...input }: Omit<AddStateInput, "context" | "entityTypeId">) =>
    unwrap({ result: await addState({ context, entityTypeId, ...input }) });
  const prebooked = await add({ name: "Prebooked", hold: "SOFT", expires: true, initial: true });
  const booked = await add({ name: "Booked", hold: "HARD", inSheets: true });
  const released = await add({ name: "Released", released: true });
  unwrap({
    result: await execute({
      operation: updateEntityType,
      input: { id: entityTypeId, expiryStateId: released.id },
      context,
    }),
  });
  return { prebooked, booked, released };
}

export type ToStateInput = Ctx & { lineId: string; stateId: string };

/** `line.changeState`; returns the result. */
export const toState = ({ context, lineId, stateId }: ToStateInput) =>
  execute({ operation: changeLineState, input: { lineId, stateId }, context });
