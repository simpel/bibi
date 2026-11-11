import { createLayout, createLine, type ExecuteContext, execute } from "../src/index";
import { createTypeWithField } from "./customer-helpers";
import { unwrap } from "./helpers";
import { createBookableItem, hours } from "./occupancy-helpers";
import { createTestOrder, orderSetup } from "./order-helpers";

/** An order, a line type with one TEXT field and a bookable room with a layout (ADR 0103). */
export async function programSetup() {
  const { context, type: orderType, customer } = await orderSetup();
  const order = await createTestOrder({
    context,
    entityTypeId: orderType.id,
    customerId: customer.id,
  });
  const { type, key } = await createTypeWithField({
    context,
    base: "LINE",
    name: "Meeting",
  });
  const room = await createBookableItem({ context });
  const layout = unwrap({
    result: await execute({
      operation: createLayout,
      input: { itemId: room.id, name: "Theatre", capacity: 120, setupMinutes: 60 },
      context,
    }),
  });
  return { context, order, type, key, room, layout };
}

export type CreateTestLineInput = {
  context: ExecuteContext;
  orderId: string;
  entityTypeId: string;
  from: number;
  to: number;
  itemId?: string;
  layoutId?: string;
  quantity?: number;
};

/**
 * Runs `line.create` for `[from, to)` on 1 November 2037 (UTC) and returns the result. Far ahead
 * on purpose: holds re-derive only for lines that have not ended (`sync_line_occupancy.sql`).
 */
export const createTestLine = ({ context, from, to, ...input }: CreateTestLineInput) =>
  execute({
    operation: createLine,
    input: { name: "Morning session", ...hours({ from, to }), ...input },
    context,
  });

export type ActiveOccupanciesInput = { context: ExecuteContext; lineId: string };

/** The active occupancies a line holds (its hold and setup buffer), earliest first. */
export const activeOccupancies = ({ context, lineId }: ActiveOccupanciesInput) =>
  context.db.occupancy.findMany({
    where: { lineId },
    orderBy: { startsAt: "asc" },
  });
