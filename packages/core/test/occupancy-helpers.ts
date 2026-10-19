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
