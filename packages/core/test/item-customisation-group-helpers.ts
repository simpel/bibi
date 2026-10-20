import {
  createEntityType,
  createItem,
  type ExecuteContext,
  execute,
  type ItemCustomisationGroupInput,
} from "../src/index";
import { unwrap } from "./helpers";
import { createTestItem } from "./item-helpers";

type Ctx = { context: ExecuteContext };
type Capabilities = ("BUNDLE" | "CUSTOMISATIONS")[];
type ItemTypeInput = Ctx & { name: string; capabilities?: Capabilities };

export async function createItemType({ context, ...input }: ItemTypeInput) {
  const result = await execute({
    operation: createEntityType,
    input: { base: "ITEM", ...input },
    context,
  });
  return unwrap({ result });
}

/** A meal type with BUNDLE + CUSTOMISATIONS, and three dishes to compose meals from. */
export async function createMealSetup({ context }: Ctx) {
  const meal = await createItemType({
    context,
    name: "Meal",
    capabilities: ["BUNDLE", "CUSTOMISATIONS"],
  });
  const dish = await createItemType({ context, name: "Dish" });
  const make = ({ name }: { name: string }) =>
    createTestItem({ context, entityTypeId: dish.id, name });
  const cod = await make({ name: "Cod" });
  const veal = await make({ name: "Veal" });
  const salad = await make({ name: "Salad" });
  return { meal, cod: cod.id, veal: veal.id, salad: salad.id };
}

export type CreateLunchInput = Ctx & {
  entityTypeId: string;
  parts: string[];
  customisationGroups: ItemCustomisationGroupInput[];
};

export function createLunch({
  context,
  entityTypeId,
  parts: partIds,
  customisationGroups,
}: CreateLunchInput) {
  const parts = partIds.map((itemId) => ({ itemId }));
  const input = { entityTypeId, name: "Lunch", parts, customisationGroups };
  return execute({ operation: createItem, input, context });
}

export type MainCourseInput = { itemIds: string[]; minPick?: number; maxPick?: number };

/** A "Main course" group, by default pick exactly one. */
export const mainCourse = ({ itemIds, minPick = 1, maxPick = 1 }: MainCourseInput) => ({
  name: "Main course",
  minPick,
  maxPick,
  itemIds,
});

/** Groups with sorted options: parts written in one statement have no fixed order. */
export const sortedGroups = ({ groups }: { groups: ItemCustomisationGroupInput[] }) =>
  groups.map((group) => ({ ...group, itemIds: [...group.itemIds].sort() }));
