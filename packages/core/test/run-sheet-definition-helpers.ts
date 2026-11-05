import {
  createEntityType,
  createFieldDefinition,
  createVocabulary,
  type ExecuteContext,
  execute,
} from "../src/index";
import { unwrap } from "./helpers";
import { createTestResponsibility } from "./responsibility-helpers";

export type RunSheetSetupInput = { context: ExecuteContext };

/** A kitchen-order setup: a dish type with a field, an allergen list, sent to Head of kitchen. */
export async function createRunSheetSetup({ context }: RunSheetSetupInput) {
  const dish = unwrap({
    result: await execute({
      operation: createEntityType,
      input: { base: "ITEM", name: "Dish", capabilities: ["PRICED"] },
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

export type RunSheetSetup = Awaited<ReturnType<typeof createRunSheetSetup>>;

/** "Kitchen order" over the setup, with the dish type listed twice (stored once). */
export const kitchenOrder = ({ dish, field, list, responsibility }: RunSheetSetup) => ({
  name: "Kitchen order",
  entityTypeIds: [dish.id, dish.id],
  fieldIds: [field.id],
  vocabularyIds: [list.id],
  responsibilityId: responsibility.id,
});
