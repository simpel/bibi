import { createLine, createSetup, type ExecuteContext, execute, updateItem } from "../src/index";
import { createTypeWithField } from "./customer-helpers";
import { unwrap } from "./helpers";
import { createBookableItem, hours } from "./occupancy-helpers";
import { createTestOrder, orderSetup } from "./order-helpers";

/** An order, a line type with one TEXT field and a bookable room with a setup. */
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
  const setup = unwrap({
    result: await execute({
      operation: createSetup,
      input: { name: "Theatre", changeoverMinutes: 60 },
      context,
    }),
  });
  unwrap({
    result: await execute({
      operation: updateItem,
      input: { id: room.id, setups: [{ setupId: setup.id, capacity: 120 }] },
      context,
    }),
  });
  return { context, order, type, key, room, setup };
}

export type CreateTestLineInput = {
  context: ExecuteContext;
  orderId: string;
  entityTypeId: string;
  from: number;
  to: number;
  itemId?: string;
  setupId?: string;
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
