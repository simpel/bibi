import "server-only";
import { type ItemDto, listEntityTypes, listItems, listVenues, ok, type Result } from "@bibi/core";
import type { CalendarAsset } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { listAll } from "@/server/list-all";
import { orEmpty } from "./or-empty";

type Translate = Awaited<ReturnType<typeof getTranslations<"calendar">>>;

/** One fact to pick a row by: the most people a setup takes, else the venue when there are many. */
function detailOf({ item, venue, t }: { item: ItemDto; venue?: string; t: Translate }) {
  const capacity = Math.max(0, ...item.setups.map((setup) => setup.capacity));
  if (capacity > 0) return t("capacity", { count: capacity });
  return venue;
}

type ToAssetsInput = {
  items: readonly ItemDto[];
  types: ReadonlyMap<string, string>;
  venues: ReadonlyMap<string, string>;
  t: Translate;
};

/** Rows grouped by the organization's own item type, the groups and rows by name. */
function toAssets({ items, types, venues, t }: ToAssetsInput): CalendarAsset[] {
  const many = venues.size > 1;
  return items
    .map((item) => {
      const venue = many && item.venueId ? venues.get(item.venueId) : undefined;
      const detail = detailOf({ item, venue, t });
      const group = types.get(item.entityTypeId) ?? "";
      return { id: item.id, name: item.name, group, ...(detail ? { detail } : {}) };
    })
    .sort((a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name));
}

/** Every bookable item as a calendar row (`BOOKABLE`, ADR 0021): the calendar's rows. */
export async function loadCalendarAssets(): Promise<Result<CalendarAsset[]>> {
  const [items, types, venues, t] = await Promise.all([
    listAll({ operation: listItems, input: { capability: "BOOKABLE" } }),
    listAll({ operation: listEntityTypes, input: { base: "ITEM" } }),
    listAll({ operation: listVenues, input: {} }).then((result) => orEmpty({ result })),
    getTranslations("calendar"),
  ]);
  if (!items.ok) return items;
  if (!types.ok) return types;
  if (!venues.ok) return venues;
  const byId = ({ id, name }: { id: string; name: string }) => [id, name] as const;
  return ok({
    value: toAssets({
      items: items.value,
      types: new Map(types.value.map(byId)),
      venues: new Map(venues.value.map(byId)),
      t,
    }),
  });
}
