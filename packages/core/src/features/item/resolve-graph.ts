import type { Item } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import { MAX_PART_DEPTH } from "./schema";

type Db = Pick<OperationContext, "db">;

/** One step down from an item: a part, or an option in one of its customisation groups. */
export type ItemEdge = {
  parentId: string;
  childId: string;
  quantity: number;
  offsetMinutes: number;
  durationMinutes: number | null;
  required: boolean;
  /** The customisation group the child is an option in; null for a part. */
  groupId: string | null;
};

type GroupFacts = { name: string; minPick: number; options: number };

/** Everything below one item: the items, their parts and options, and their groups. */
export type ItemGraph = {
  items: ReadonlyMap<string, Item>;
  /** Parent id → its parts (by offset), then its options (by group and position). */
  edges: ReadonlyMap<string, readonly ItemEdge[]>;
  /** Customisation group id → its name, minPick and number of active options. */
  groups: ReadonlyMap<string, GroupFacts>;
};

type Level = { context: Db; ids: string[] };

/** The edges below the given items, parts first, and the groups their options belong to. */
async function edgesBelow({ context, ids }: Level) {
  const parts = await context.db.itemPart.findMany({
    where: { parentId: { in: ids } },
    orderBy: [{ offsetMinutes: "asc" }, { position: "asc" }],
  });
  const groups = await context.db.itemCustomisationGroup.findMany({
    where: { itemId: { in: ids } },
    orderBy: [{ position: "asc" }],
    include: { options: { where: { item: { status: "ACTIVE" } }, orderBy: { position: "asc" } } },
  });
  const edges: ItemEdge[] = parts.map(({ parentId, partId, ...part }) => ({
    ...{ parentId, childId: partId, quantity: part.quantity, required: part.required },
    ...{ offsetMinutes: part.offsetMinutes, durationMinutes: part.durationMinutes, groupId: null },
  }));
  for (const group of groups) {
    for (const { itemId } of group.options) {
      edges.push({
        ...{ parentId: group.itemId, childId: itemId, quantity: 1, required: true },
        ...{ offsetMinutes: 0, durationMinutes: null, groupId: group.id },
      });
    }
  }
  return { edges, groups };
}

export type LoadItemGraphInput = { context: Db; rootId: string };

/**
 * Loads the item and every part and option below it, level by level (at most MAX_PART_DEPTH
 * levels, ADR 0021). Archived items are hidden by the org-scoped client and drop out of the tree.
 */
export async function loadItemGraph({ context, rootId }: LoadItemGraphInput): Promise<ItemGraph> {
  const items = new Map<string, Item>();
  const edges = new Map<string, ItemEdge[]>();
  const groups = new Map<string, GroupFacts>();
  let frontier = [rootId];
  for (let level = 0; level < MAX_PART_DEPTH && frontier.length > 0; level++) {
    const ids = [...new Set(frontier)].filter((id) => !items.has(id));
    const rows = ids.length ? await context.db.item.findMany({ where: { id: { in: ids } } }) : [];
    for (const row of rows) items.set(row.id, row);
    if (!rows.length) break;
    const below = await edgesBelow({ context, ids: rows.map((row) => row.id) });
    for (const { id, name, minPick, options } of below.groups) {
      groups.set(id, { name, minPick, options: options.length });
    }
    for (const edge of below.edges) {
      edges.set(edge.parentId, [...(edges.get(edge.parentId) ?? []), edge]);
    }
    frontier = below.edges.map((edge) => edge.childId);
  }
  return { items, edges, groups };
}
