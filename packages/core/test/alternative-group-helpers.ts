import {
  chooseAlternative,
  createAlternativeGroup,
  type ExecuteContext,
  execute,
} from "../src/index";
import { unwrap } from "./helpers";
import { createTestItem } from "./item-helpers";
import { addLine, gridSetup } from "./status-grid-helpers";

type Ctx = { context: ExecuteContext };

export type GroupLinesInput = Ctx & { orderId: string; lineIds: string[]; name?: string };

/** `alternativeGroup.create`; returns the result. */
export const groupLines = ({ context, orderId, lineIds, name = "Room" }: GroupLinesInput) =>
  execute({ operation: createAlternativeGroup, input: { orderId, name, lineIds }, context });

export type ChooseInput = Ctx & { id: string; lineId: string };

/** `alternativeGroup.choose`; returns the result. */
export const choose = ({ context, id, lineId }: ChooseInput) =>
  execute({ operation: chooseAlternative, input: { id, lineId }, context });

/**
 * An order in Lead with two rooms of the bookable type held soft at the same time (Room A and
 * Room B, both Prebooked) and grouped as alternatives (ADR 0052).
 */
export async function roomAlternatives() {
  const setup = await gridSetup();
  const { context, room } = setup;
  const other = await createTestItem({ context, entityTypeId: room.entityTypeId, name: "Bersån" });
  const order = await setup.newOrder();
  const a = await addLine({ setup, orderId: order.id, itemId: room.id });
  const b = await addLine({ setup, orderId: order.id, itemId: other.id });
  const group = unwrap({
    result: await groupLines({ context, orderId: order.id, lineIds: [a.id, b.id] }),
  });
  return { ...setup, order, a, b, group };
}
