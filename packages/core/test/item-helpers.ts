import { createEntityType, createItem, type ExecuteContext, execute } from "../src/index";
import { unwrap } from "./helpers";

export type RoomTypeInput = { context: ExecuteContext };

/** An item type like a conference room: bookable, with setups and a price. */
export async function createRoomType({ context }: RoomTypeInput) {
  const input = {
    base: "ITEM" as const,
    name: "Konferensrum",
    capabilities: ["BOOKABLE" as const, "SETUPS" as const, "PRICED" as const],
  };
  return unwrap({ result: await execute({ operation: createEntityType, input, context }) });
}

export type CreateTestItemInput = {
  context: ExecuteContext;
  entityTypeId: string;
  name: string;
  venueId?: string;
  description?: string;
};

export async function createTestItem({ context, ...input }: CreateTestItemInput) {
  return unwrap({ result: await execute({ operation: createItem, input, context }) });
}
