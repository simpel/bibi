import {
  createFieldDefinition,
  createItem,
  createVocabulary,
  type ExecuteContext,
  execute,
  type ItemCustomisationGroupInput,
} from "../src/index";
import { unwrap } from "./helpers";
import { createItemType } from "./item-customisation-group-helpers";

type Ctx = { context: ExecuteContext };

export const ALLERGENS = ["Gluten", "Milk", "Fish", "Nuts", "Egg"] as const;
export type Allergen = (typeof ALLERGENS)[number];

/** A list of allergens and a dish type whose multi-choice field picks from it. */
async function createDishType({ context }: Ctx) {
  const list = unwrap({
    result: await execute({
      operation: createVocabulary,
      input: { name: "Allergens", values: [...ALLERGENS] },
      context,
    }),
  });
  const dish = await createItemType({ context, name: "Dish" });
  const field = { entityTypeId: dish.id, kind: "MULTI_CHOICE" as const };
  const input = { ...field, name: "Allergens", vocabularyId: list.id };
  unwrap({ result: await execute({ operation: createFieldDefinition, input, context }) });
  // Inline options are not a list, so they never count as tags (ADR 0026).
  const inline = { ...field, name: "Style", options: ["Gluten", "Hot"] };
  unwrap({ result: await execute({ operation: createFieldDefinition, input: inline, context }) });
  const valueId = new Map(list.values.map((value) => [value.name, value.id]));
  return { dish, valueId };
}

type Part = { itemId: string; required?: boolean; quantity?: number; offsetMinutes?: number };
type BundleInput = {
  name: string;
  parts: Part[];
  customisationGroups?: ItemCustomisationGroupInput[];
};

/** One dish per allergen combination used by the menu. */
async function createDishes({ context }: Ctx) {
  const { dish, valueId } = await createDishType({ context });
  const make = async ({ name, tags }: { name: string; tags: Allergen[] }) => {
    const fields = { allergens: tags.map((tag) => valueId.get(tag)), style: ["Gluten"] };
    const input = { entityTypeId: dish.id, name, fields };
    return unwrap({ result: await execute({ operation: createItem, input, context }) }).id;
  };
  const dishes = {
    bread: await make({ name: "Bread", tags: ["Gluten"] }),
    butter: await make({ name: "Butter", tags: ["Milk"] }),
    cod: await make({ name: "Cod", tags: ["Fish"] }),
    veal: await make({ name: "Veal", tags: [] }),
    cake: await make({ name: "Nut cake", tags: ["Nuts", "Egg"] }),
    salad: await make({ name: "Salad", tags: ["Milk"] }),
    eggRoll: await make({ name: "Egg roll", tags: ["Egg"] }),
  };
  return { dishes, valueId };
}

/** The capabilities of the menu's bundle type. */
const BUNDLE_TYPE: ("BUNDLE" | "CUSTOMISATIONS")[] = ["BUNDLE", "CUSTOMISATIONS"];

/**
 * Dishes and bundles of several levels:
 * day = 3 × lunch + salad (Milk); lunch = 2 × starter + choice(cod | veal) + optional cake;
 * starter = bread (Gluten) + optional butter (Milk); duo = a choice with one option (egg roll).
 */
export async function createMenu({ context }: Ctx) {
  const { dishes, valueId } = await createDishes({ context });
  const { bread, butter, cod, veal, cake, salad, eggRoll } = dishes;
  const pack = await createItemType({ context, name: "Bundle", capabilities: BUNDLE_TYPE });
  const compose = async ({ name, parts, customisationGroups = [] }: BundleInput) => {
    const input = { entityTypeId: pack.id, name, parts, customisationGroups };
    return unwrap({ result: await execute({ operation: createItem, input, context }) }).id;
  };
  const starter = await compose({
    name: "Starter",
    parts: [{ itemId: bread }, { itemId: butter, required: false, offsetMinutes: 5 }],
  });
  const lunch = await compose({
    name: "Lunch",
    parts: [
      { itemId: starter, quantity: 2 },
      { itemId: cod, offsetMinutes: 30 },
      { itemId: veal, offsetMinutes: 35 },
      { itemId: cake, required: false, offsetMinutes: 60 },
    ],
    customisationGroups: [{ name: "Main", minPick: 1, maxPick: 1, itemIds: [cod, veal] }],
  });
  const day = await compose({
    name: "Day",
    parts: [
      { itemId: lunch, offsetMinutes: 180, quantity: 3 },
      { itemId: salad, offsetMinutes: 200 },
    ],
  });
  const only = [{ name: "Only", minPick: 1, maxPick: 1, itemIds: [eggRoll] }];
  const duo = await compose({
    name: "Duo",
    parts: [{ itemId: eggRoll }],
    customisationGroups: only,
  });
  return { ids: { ...dishes, starter, lunch, day, duo }, valueId };
}
