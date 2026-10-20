import type { Item, ItemPart } from "@okazi/db";
import type { OperationContext } from "../../operations/types";
import { MAX_PART_DEPTH } from "./schema";

type Db = Pick<OperationContext, "db">;

/** Everything below one item: the items, their parts and the names of their customisation groups. */
export type ItemGraph = {
  items: ReadonlyMap<string, Item>;
  /** Parent id → its part rows, by offset. */
  parts: ReadonlyMap<string, readonly ItemPart[]>;
  /** Customisation group id → { name, minPick, number of options }. */
  groups: ReadonlyMap<string, { name: string; minPick: number; options: number }>;
};

export type LoadItemGraphInput = { context: Db; rootId: string };

/**
 * Loads the item and every part below it, level by level (at most MAX_PART_DEPTH levels,
 * ADR 0021). Archived parts are hidden by the org-scoped client and drop out of the tree.
 */
export async function loadItemGraph({ context, rootId }: LoadItemGraphInput): Promise<ItemGraph> {
  const items = new Map<string, Item>();
  const parts = new Map<string, ItemPart[]>();
  let frontier = [rootId];
  for (let level = 0; level < MAX_PART_DEPTH && frontier.length > 0; level++) {
    const ids = [...new Set(frontier)].filter((id) => !items.has(id));
    const rows = ids.length ? await context.db.item.findMany({ where: { id: { in: ids } } }) : [];
    for (const row of rows) items.set(row.id, row);
    const edges = rows.length
      ? await context.db.itemPart.findMany({
          where: { parentId: { in: rows.map((row) => row.id) } },
          orderBy: [{ offsetMinutes: "asc" }, { position: "asc" }],
        })
      : [];
    for (const edge of edges) {
      parts.set(edge.parentId, [...(parts.get(edge.parentId) ?? []), edge]);
    }
    frontier = edges.map((edge) => edge.partId);
  }
  return { items, parts, groups: await loadGroups({ context, parts }) };
}

type LoadGroupsInput = { context: Db; parts: ReadonlyMap<string, readonly ItemPart[]> };

async function loadGroups({ context, parts }: LoadGroupsInput): Promise<ItemGraph["groups"]> {
  const rows = await context.db.itemCustomisationGroup.findMany({
    where: { itemId: { in: [...parts.keys()] } },
  });
  const all = [...parts.values()].flat();
  return new Map(
    rows.map(({ id, name, minPick }) => [
      id,
      { name, minPick, options: all.filter((part) => part.customisationGroupId === id).length },
    ]),
  );
}
