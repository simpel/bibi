import type { Item } from "@okazi/db";
import type { ItemEdge, ItemGraph } from "./resolve-graph";
import type { ResolvedItemNode } from "./resolve-schema";

type Step = {
  path: readonly string[];
  part: ItemEdge | null;
  mandatory: boolean;
  totalQuantity: number;
  offsetMinutes: number;
};

export type BuildTreeInput = {
  graph: ItemGraph;
  rootId: string;
  tagsOf: (input: { item: Item }) => string[];
};

type GroupOfInput = { graph: ItemGraph; part: ItemEdge };

/** An option is mandatory only when its group must pick all of its options (no alternative). */
function optionIsMandatory({ graph, part }: GroupOfInput): boolean {
  if (!part.groupId) return true;
  const group = graph.groups.get(part.groupId);
  return group !== undefined && group.minPick >= group.options;
}

type NodeOfInput = { item: Item; step: Step; graph: ItemGraph; tags: string[] };

function nodeOf({ item, step, graph, tags }: NodeOfInput): ResolvedItemNode {
  const { part } = step;
  const groupId = part?.groupId;
  return {
    path: [...step.path],
    depth: step.path.length - 1,
    itemId: item.id,
    name: item.name,
    entityTypeId: item.entityTypeId,
    quantity: part?.quantity ?? 1,
    totalQuantity: step.totalQuantity,
    offsetMinutes: step.offsetMinutes,
    durationMinutes: part ? part.durationMinutes : item.defaultDurationMinutes,
    required: part?.required ?? true,
    customisationGroup: groupId ? (graph.groups.get(groupId)?.name ?? null) : null,
    mandatory: step.mandatory,
    priceMinor: item.priceMinor,
    priceUnit: item.priceUnit,
    vatRatePercent: item.vatRatePercent,
    tags,
  };
}

/**
 * The item and its parts at every level as a flat list, depth first. A node is mandatory when
 * every part on the way down is required and no choice option with an alternative (ADR 0021).
 */
export function buildTree({ graph, rootId, tagsOf }: BuildTreeInput): ResolvedItemNode[] {
  const nodes: ResolvedItemNode[] = [];
  const visit = ({ id, step }: { id: string; step: Step }) => {
    const item = graph.items.get(id);
    if (!item) return;
    nodes.push(nodeOf({ item, step, graph, tags: tagsOf({ item }) }));
    for (const part of graph.edges.get(id) ?? []) {
      if (step.path.includes(part.childId)) continue;
      visit({
        id: part.childId,
        step: {
          path: [...step.path, part.childId],
          part,
          mandatory: step.mandatory && part.required && optionIsMandatory({ graph, part }),
          totalQuantity: step.totalQuantity * part.quantity,
          offsetMinutes: step.offsetMinutes + part.offsetMinutes,
        },
      });
    }
  };
  const root = { path: [rootId], part: null, mandatory: true, totalQuantity: 1 };
  visit({ id: rootId, step: { ...root, offsetMinutes: 0 } });
  return nodes;
}
