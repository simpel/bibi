import { err, ok, type Result } from "../../errors/result";
import { createItemTypeGroup } from "../../features/item-type-group/operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoType } from "./config-types";

/** The groups the welcome flow creates (ADR 0101), in order. */
export const DEMO_TYPE_GROUPS = ["Spaces", "Food & drink", "Extras"] as const;
export type DemoTypeGroup = (typeof DEMO_TYPE_GROUPS)[number];

const SPACES = new Set(["Conference room", "Boat"]);
const FOOD = new Set(["Dish", "Drink", "Meal"]);

/** The group of a demo item type: rooms and spaces, food and drink, else extras. */
export const groupOfDemoType = ({ type }: { type: Pick<DemoType, "name"> }): DemoTypeGroup =>
  SPACES.has(type.name) ? "Spaces" : FOOD.has(type.name) ? "Food & drink" : "Extras";

export type SeedItemTypeGroupsInput = { context: ExecuteContext; types: readonly DemoType[] };

/** Creates the groups through `itemTypeGroup.create`; name to id, empty without item types. */
export async function seedItemTypeGroups({
  context,
  types,
}: SeedItemTypeGroupsInput): Promise<Result<Map<string, string>>> {
  const groups = new Map<string, string>();
  if (!types.some((type) => type.base === "ITEM")) return ok({ value: groups });
  for (const name of DEMO_TYPE_GROUPS) {
    const created = await execute({ operation: createItemTypeGroup, input: { name }, context });
    if (!created.ok) return err({ error: created.error });
    groups.set(name, created.value.id);
  }
  return ok({ value: groups });
}
