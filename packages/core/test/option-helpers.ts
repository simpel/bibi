import { createOption, type ExecuteContext, execute } from "../src/index";
import { unwrap } from "./helpers";
import { hours } from "./occupancy-helpers";

const DAY = 86_400_000;

export type PlaceOptionInput = {
  context: ExecuteContext;
  itemId: string;
  from: number;
  to: number;
};

/** An option on `itemId` for `[from, to)` on 1 November 2026 that expires in a week. */
export async function placeOption({ context, itemId, from, to }: PlaceOptionInput) {
  const expiresAt = new Date(Date.now() + 7 * DAY);
  const input = { itemId, ...hours({ from, to }), expiresAt };
  return unwrap({ result: await execute({ operation: createOption, input, context }) });
}

export type ExpireNowInput = { context: ExecuteContext; id: string };

/** Moves an option's expiry into the past (a past date cannot be given to `option.create`). */
export const makeOverdue = ({ context, id }: ExpireNowInput) =>
  context.db.option.update({ where: { id }, data: { expiresAt: new Date(Date.now() - 60_000) } });
