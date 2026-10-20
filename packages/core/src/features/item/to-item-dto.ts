import type { Item, ItemCustomisationGroup, ItemPart } from "@okazi/db";
import type { OperationContext } from "../../operations/types";
import { loadRecordLinks, withLinks } from "../../records/record-links";
import type { ItemDto } from "./schema";

type Db = Pick<OperationContext, "db">;

type CustomisationGroupsOfInput = {
  groups: readonly ItemCustomisationGroup[];
  parts: readonly ItemPart[];
};

/** An item's customisation groups in order, each with its options in the order of the parts. */
const customisationGroupsOf = ({ groups, parts }: CustomisationGroupsOfInput) =>
  groups.map(({ id, name, minPick, maxPick }) => ({
    name,
    minPick,
    maxPick,
    itemIds: parts.filter((part) => part.customisationGroupId === id).map((part) => part.partId),
  }));

export type ToItemDtosInput = { context: Db; rows: readonly Item[] };

/** Items with setup capacities (largest first), parts (by offset) and customisation groups. */
export async function toItemDtos({ context, rows }: ToItemDtosInput): Promise<ItemDto[]> {
  const ids = rows.map((row) => row.id);
  const setups = await context.db.itemSetup.findMany({
    where: { itemId: { in: ids } },
    orderBy: [{ capacity: "desc" }, { setupId: "asc" }],
    select: { itemId: true, setupId: true, capacity: true },
  });
  const parts = await context.db.itemPart.findMany({
    where: { parentId: { in: ids } },
    orderBy: [{ offsetMinutes: "asc" }, { position: "asc" }],
  });
  const groups = await context.db.itemCustomisationGroup.findMany({
    where: { itemId: { in: ids } },
    orderBy: [{ position: "asc" }],
  });
  const links = await loadRecordLinks({ context, recordIds: ids });
  return rows.map((row) => ({
    ...row,
    fields: withLinks({ fields: row.fields, links: links.filter((l) => l.recordId === row.id) }),
    setups: setups
      .filter((setup) => setup.itemId === row.id)
      .map(({ setupId, capacity }) => ({ setupId, capacity })),
    parts: parts
      .filter((part) => part.parentId === row.id)
      .map(({ partId, quantity, offsetMinutes, durationMinutes, required }) => ({
        itemId: partId,
        quantity,
        offsetMinutes,
        durationMinutes,
        required,
      })),
    customisationGroups: customisationGroupsOf({
      groups: groups.filter((group) => group.itemId === row.id),
      parts: parts.filter((part) => part.parentId === row.id),
    }),
  }));
}

export type LoadItemInput = { context: Db; id: string };

export async function loadItem({ context, id }: LoadItemInput): Promise<ItemDto | null> {
  const row = await context.db.item.findFirst({ where: { id } });
  if (!row) return null;
  const [dto] = await toItemDtos({ context, rows: [row] });
  return dto ?? null;
}
