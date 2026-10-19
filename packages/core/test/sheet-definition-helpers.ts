import {
  createEntityType,
  createFieldDefinition,
  createVocabulary,
  type ExecuteContext,
  execute,
} from "../src/index";
import { unwrap } from "./helpers";
import { createTestResponsibility } from "./responsibility-helpers";

export type SheetSetupInput = { context: ExecuteContext };

/** A kitchen-order setup: a dish type with a field, an allergen list, sent to Head of kitchen. */
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
  const responsibility = await createTestResponsibility({ context });
  return { dish, field, list, responsibility };
}

export type SheetSetup = Awaited<ReturnType<typeof createSheetSetup>>;

/** "Kitchen order" over the setup, with the dish type listed twice (stored once). */
export const kitchenOrder = ({ dish, field, list, responsibility }: SheetSetup) => ({
  name: "Kitchen order",
  entityTypeIds: [dish.id, dish.id],
  fieldIds: [field.id],
  vocabularyIds: [list.id],
  responsibilityId: responsibility.id,
});
