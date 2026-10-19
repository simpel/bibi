import { createLine, createSetup, type ExecuteContext, execute, updateItem } from "../src/index";
import { createTypeWithField } from "./customer-helpers";
import { unwrap } from "./helpers";
import { createBookableItem, hours } from "./occupancy-helpers";
import { createTestTicket, ticketSetup } from "./ticket-helpers";

/** A ticket, a line type with one TEXT field and a bookable room with a setup. */
export async function programSetup() {
  const { context, type: ticketType, customer } = await ticketSetup();
  const ticket = await createTestTicket({
    context,
    entityTypeId: ticketType.id,
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
  return { context, ticket, type, key, room, setup };
}

export type CreateTestLineInput = {
  context: ExecuteContext;
  ticketId: string;
  entityTypeId: string;
  from: number;
  to: number;
  itemId?: string;
  setupId?: string;
};

/** Runs `line.create` for `[from, to)` on 1 November 2026 (UTC) and returns the result. */
export const createTestLine = ({ context, from, to, ...input }: CreateTestLineInput) =>
  execute({
    operation: createLine,
    input: { name: "Morning session", ...hours({ from, to }), ...input },
    context,
  });

export type ActiveOccupanciesInput = { context: ExecuteContext; sourceId: string };

/** The active occupancies a line holds, earliest first. */
export const activeOccupancies = ({ context, sourceId }: ActiveOccupanciesInput) =>
  context.db.occupancy.findMany({
    where: { sourceType: "line", sourceId },
    orderBy: { startsAt: "asc" },
  });
