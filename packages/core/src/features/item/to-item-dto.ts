import type { Item } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import { loadRecordLinks, withLinks } from "../../records/record-links";
import { effectiveBuffers } from "../../shared/buffers";
import { loadVenueZones } from "../../shared/time-zones";
import type { ItemDto } from "./schema";

type Db = Pick<OperationContext, "db">;

/**
 * The items' customisation groups in order, each with its options in order. An archived option
 * drops out of its group, like an archived part (ADR 0059).
 */
async function customisationGroupsOf({ context, ids }: { context: Db; ids: readonly string[] }) {
  const groups = await context.db.itemCustomisationGroup.findMany({
    where: { itemId: { in: [...ids] } },
    orderBy: [{ position: "asc" }],
    include: {
      options: {
        where: { item: { status: "ACTIVE" } },
        orderBy: [{ position: "asc" }],
        select: { itemId: true, priceEffect: true },
      },
    },
  });
  return ({ itemId }: { itemId: string }) =>
    groups
      .filter((group) => group.itemId === itemId)
      .map(({ name, minPick, maxPick, options }) => ({ name, minPick, maxPick, options }));
}

export type ToItemDtosInput = { context: Db; rows: readonly Item[] };

/** The default buffers of the items' types (ADR 0059), by type id. */
async function typeBuffers({ context, rows }: ToItemDtosInput) {
  const types = await context.db.entityType.findMany({
    where: {
      id: { in: [...new Set(rows.map((row) => row.entityTypeId))] },
      status: { in: ["ACTIVE", "ARCHIVED"] },
    },
    select: { id: true, setupMinutes: true, teardownMinutes: true },
  });
  return new Map(types.map(({ id, ...minutes }) => [id, minutes]));
}

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
  const groupsOf = await customisationGroupsOf({ context, ids });
  const links = await loadRecordLinks({ context, recordIds: ids });
  const types = await typeBuffers({ context, rows });
  const zoneOf = await loadVenueZones({ context, venueIds: rows.map((row) => row.venueId) });
  return rows.map((row) => ({
    ...row,
    ...effectiveBuffers({ item: row, type: types.get(row.entityTypeId) ?? null }),
    timeZone: zoneOf({ venueId: row.venueId }),
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
    customisationGroups: groupsOf({ itemId: row.id }),
  }));
}

export type LoadItemInput = { context: Db; id: string };

export async function loadItem({ context, id }: LoadItemInput): Promise<ItemDto | null> {
  const row = await context.db.item.findFirst({ where: { id } });
  if (!row) return null;
  const [dto] = await toItemDtos({ context, rows: [row] });
  return dto ?? null;
}
