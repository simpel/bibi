import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { resolveItemTags } from "./resolve-item";
import { ItemResolutionSchema, ItemResolveInputSchema } from "./resolve-schema";

export const resolveItem = defineOperation({
  name: "item.resolve",
  kind: "query",
  description:
    "Expand an item into its parts at every level (ADR 0021) and compute its inherited list " +
    "values (tags, e.g. allergens): `contains` = carried by the item or a mandatory part, " +
    "`mayContain` = only carried by optional parts or choice options (with the options that " +
    "carry them). Use this, never your own reasoning over item_get, to tell what an item contains.",
  input: ItemResolveInputSchema,
  output: ItemResolutionSchema,
  permission: "item:view",
  handler: async ({ input, context }) => {
    const resolution = await resolveItemTags({ context, id: input.id });
    return resolution ? ok({ value: resolution }) : notFound({ entity: "Item" });
  },
});
