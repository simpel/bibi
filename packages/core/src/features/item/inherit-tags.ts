import type { TagValue } from "./item-tags";
import type { ResolvedItemNode, ResolvedTag } from "./resolve-schema";

export type InheritTagsInput = {
  nodes: readonly ResolvedItemNode[];
  /** Active list values by id, in list order. */
  values: ReadonlyMap<string, TagValue>;
};

export type InheritedTags = { contains: ResolvedTag[]; mayContain: ResolvedTag[] };

type CollectInput = { nodes: readonly ResolvedItemNode[]; values: InheritTagsInput["values"] };

/** Value id → the distinct items carrying it, in list order of the values. */
function collect({ nodes, values }: CollectInput): ResolvedTag[] {
  const carriers = new Map<string, Set<string>>();
  for (const node of nodes) {
    for (const id of node.tags) carriers.set(id, (carriers.get(id) ?? new Set()).add(node.itemId));
  }
  return [...values.values()]
    .filter(({ valueId }) => carriers.has(valueId))
    .map((value) => ({ ...value, itemIds: [...(carriers.get(value.valueId) ?? [])] }));
}

/**
 * The only place inherited tags are computed (ADR 0021). The item and its mandatory parts at
 * every level give "contains"; optional parts and choice options give "may contain", listing the
 * options that carry the value. A value that is contained is never also "may contain".
 */
export function inheritTags({ nodes, values }: InheritTagsInput): InheritedTags {
  const contains = collect({ nodes: nodes.filter((node) => node.mandatory), values });
  const contained = new Set(contains.map((tag) => tag.valueId));
  const mayContain = collect({
    nodes: nodes.filter((node) => !node.mandatory),
    values,
  }).filter((tag) => !contained.has(tag.valueId));
  return { contains, mayContain };
}
