import {
  createEntityType,
  createFieldDefinition,
  createVocabulary,
  type ExecuteContext,
  execute,
} from "../src/index";
import { unwrap } from "./helpers";

export type SheetSetupInput = { context: ExecuteContext };

/** A kitchen-order setup: a dish type with a field, an allergen list, sent to members. */
export async function createSheetSetup({ context }: SheetSetupInput) {
  const dish = unwrap({
    result: await execute({
      operation: createEntityType,
      input: { base: "ITEM", name: "Dish", behaviours: ["PRICED"] },
      context,
    }),
  });
  const field = unwrap({
    result: await execute({
      operation: createFieldDefinition,
      input: { entityTypeId: dish.id, name: "Serving", kind: "TEXT" },
      context,
    }),
  });
  const list = unwrap({
    result: await execute({ operation: createVocabulary, input: { name: "Allergens" }, context }),
  });
  return { dish, field, list, role: "manager" as const };
}
