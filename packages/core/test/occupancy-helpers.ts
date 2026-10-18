import type { ExecuteContext } from "../src/index";
import { createRoomType, createTestItem } from "./item-helpers";

export type BookableItemInput = { context: ExecuteContext };

/** An active item of a fresh BOOKABLE type. */
export async function createBookableItem({ context }: BookableItemInput) {
  const type = await createRoomType({ context });
  return createTestItem({ context, entityTypeId: type.id, name: "Älvsalen" });
}

/** `[from, to)` on 1 November 2026 between whole hours (UTC). */
export const hours = ({ from, to }: { from: number; to: number }) => ({
  startsAt: new Date(Date.UTC(2026, 10, 1, from)),
  endsAt: new Date(Date.UTC(2026, 10, 1, to)),
});

export type RawOccupancyInput = {
  context: ExecuteContext;
  itemId: string;
  /** A hard hold blocks, a soft hold may overlap (ADR 0044). */
  hold: "HARD" | "SOFT";
  from: number;
  to: number;
};

/** Writes a hold row directly, without a line behind it, to test the overlap rules. */
export const insertRaw = ({ context, itemId, hold, from, to }: RawOccupancyInput) =>
  context.db.occupancy.create({
    data: {
      ...{ organizationId: context.organizationId, itemId, type: "HOLD", holdKind: hold },
      ...hours({ from, to }),
    },
  });
