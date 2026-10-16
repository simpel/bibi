import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { inheritTags } from "./inherit-tags";
import { loadTagCatalog, ownTags } from "./item-tags";
import { loadItemGraph } from "./resolve-graph";
import { ItemResolutionSchema, ItemResolveInputSchema } from "./resolve-schema";
import { buildTree } from "./resolve-tree";

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
  permission: "item:read",
  handler: async ({ input, context }) => {
    const graph = await loadItemGraph({ context, rootId: input.id });
    const root = graph.items.get(input.id);
    if (!root) return notFound({ entity: "Item" });
    const entityTypeIds = [...new Set([...graph.items.values()].map((item) => item.entityTypeId))];
    const catalog = await loadTagCatalog({ context, entityTypeIds });
    const nodes = buildTree({
      graph,
      rootId: root.id,
      tagsOf: ({ item }) => ownTags({ catalog, item }),
    });
    const tags = inheritTags({ nodes, values: catalog.values });
    return ok({ value: { itemId: root.id, name: root.name, nodes, ...tags } });
  },
});
