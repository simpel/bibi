import type { Item, ItemComponent } from "@okazi/db";
import type { ItemGraph } from "./resolve-graph";
import type { ResolvedItemNode } from "./resolve-schema";

type Step = {
  path: readonly string[];
  component: ItemComponent | null;
  mandatory: boolean;
  totalQuantity: number;
  offsetMinutes: number;
};

export type BuildTreeInput = {
  graph: ItemGraph;
  rootId: string;
  tagsOf: (input: { item: Item }) => string[];
};

type GroupOfInput = { graph: ItemGraph; component: ItemComponent };

/** An option is mandatory only when its group must pick all of its options (no alternative). */
function optionIsMandatory({ graph, component }: GroupOfInput): boolean {
  if (!component.choiceGroupId) return true;
  const group = graph.groups.get(component.choiceGroupId);
  return group !== undefined && group.minPick >= group.options;
}

type NodeOfInput = { item: Item; step: Step; graph: ItemGraph; tags: string[] };

function nodeOf({ item, step, graph, tags }: NodeOfInput): ResolvedItemNode {
  const { component } = step;
  const groupId = component?.choiceGroupId;
  return {
    path: [...step.path],
    depth: step.path.length - 1,
    itemId: item.id,
    name: item.name,
    entityTypeId: item.entityTypeId,
    quantity: component?.quantity ?? 1,
    totalQuantity: step.totalQuantity,
    offsetMinutes: step.offsetMinutes,
    durationMinutes: component ? component.durationMinutes : item.defaultDurationMinutes,
    required: component?.required ?? true,
    choiceGroup: groupId ? (graph.groups.get(groupId)?.name ?? null) : null,
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
    for (const component of graph.parts.get(id) ?? []) {
      if (step.path.includes(component.partId)) continue;
      visit({
        id: component.partId,
        step: {
          path: [...step.path, component.partId],
          component,
          mandatory:
            step.mandatory && component.required && optionIsMandatory({ graph, component }),
          totalQuantity: step.totalQuantity * component.quantity,
          offsetMinutes: step.offsetMinutes + component.offsetMinutes,
        },
      });
    }
  };
  const root = { path: [rootId], component: null, mandatory: true, totalQuantity: 1 };
  visit({ id: rootId, step: { ...root, offsetMinutes: 0 } });
  return nodes;
}
