import { createEntityType, type ExecuteContext, execute } from "../src/index";
import { createTestCustomer } from "./customer-helpers";
import { unwrap } from "./helpers";
import { createRoomType, createTestItem } from "./item-helpers";

export type PriceListSetupInput = { context: ExecuteContext };

/** A customer, a PRICED room and an item whose type lacks the PRICED capability. */
export async function priceListSetup({ context }: PriceListSetupInput) {
  const customer = await createTestCustomer({ context, name: "Nordkust AB" });
  const roomType = await createRoomType({ context });
  const room = await createTestItem({ context, entityTypeId: roomType.id, name: "Saturnus" });
  const plainType = unwrap({
    result: await execute({
      operation: createEntityType,
      input: { base: "ITEM", name: "Equipment" },
      context,
    }),
  });
  const unpriced = await createTestItem({ context, entityTypeId: plainType.id, name: "Easel" });
  return { customer, room, unpriced };
}
