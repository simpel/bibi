import type { OperationContext } from "../../operations/types";
import { inheritTags } from "./inherit-tags";
import { loadTagCatalog, ownTags } from "./item-tags";
import { loadItemGraph } from "./resolve-graph";
import type { ItemResolution } from "./resolve-schema";
import { buildTree } from "./resolve-tree";

export type ResolveItemTagsInput = { context: Pick<OperationContext, "db">; id: string };

/**
 * The expanded item and its inherited tags, or null for an unknown item. The one function behind
 * `item.resolve`, also used by sheets to match requirements against items (ADR 0021).
 */
export async function resolveItemTags({
  context,
  id,
}: ResolveItemTagsInput): Promise<ItemResolution | null> {
  const graph = await loadItemGraph({ context, rootId: id });
  const root = graph.items.get(id);
  if (!root) return null;
  const entityTypeIds = [...new Set([...graph.items.values()].map((item) => item.entityTypeId))];
  const catalog = await loadTagCatalog({ context, entityTypeIds });
  const nodes = buildTree({
    graph,
    rootId: root.id,
    tagsOf: ({ item }) => ownTags({ catalog, item }),
  });
  const tags = inheritTags({ nodes, values: catalog.values });
  return { itemId: root.id, name: root.name, nodes, ...tags };
}
