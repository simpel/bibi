import "server-only";
import { type EntityTypeDto, type ItemDto, listMembers, listSetups, type Result } from "@bibi/core";
import { loadEntityTypesOf } from "@/server/load-entity-types";
import { loadPickerItems } from "@/server/load-items-for-pickers";
import { loadTypedFormData } from "@/server/load-typed-form-data";
import { runOperation } from "@/server/run-operation";
import { loadCustomisableItems } from "../line/customisable-items";
import type { CatalogItem, IntakeCatalog } from "./intake/catalog";

const LIMIT = 100;

const active = <T extends { status: string }>({ rows }: { rows: T[] }) =>
  rows.filter(({ status }) => status === "ACTIVE");

type ToCatalogInput = {
  item: ItemDto;
  types: ReadonlyMap<string, EntityTypeDto>;
  setupNames: ReadonlyMap<string, string>;
  groups: ReadonlyMap<string, CatalogItem["groups"]>;
};

function toCatalogItem({ item, types, setupNames, groups }: ToCatalogInput): CatalogItem {
  const type = types.get(item.entityTypeId);
  return {
    ...{ id: item.id, name: item.name, timeZone: item.timeZone },
    ...{ priceMinor: item.priceMinor, priceUnit: item.priceUnit },
    typeName: type?.name ?? "",
    capabilities: type?.capabilities ?? [],
    defaultDurationMinutes: item.defaultDurationMinutes,
    setups: item.setups.map(({ setupId, capacity }) => ({
      ...{ id: setupId, capacity },
      name: setupNames.get(setupId) ?? "–",
    })),
    groups: groups.get(item.id) ?? [],
  };
}

/** The catalog's active items with their types, setups and option groups (one page each). */
async function loadItems(): Promise<CatalogItem[] | null> {
  const [items, types, setups, customisable] = await Promise.all([
    loadPickerItems(),
    loadEntityTypesOf({ base: "ITEM" }),
    runOperation({ operation: listSetups, input: { limit: LIMIT } }),
    loadCustomisableItems(),
  ]);
  if (!items.ok) return null;
  const byId = new Map((types.ok ? types.value.items : []).map((type) => [type.id, type]));
  const setupNames = new Map((setups.ok ? setups.value.items : []).map((s) => [s.id, s.name]));
  const groups = new Map(customisable.map(({ itemId, groups: own }) => [itemId, own]));
  return active({ rows: items.value.items })
    .filter((item) => item.customerId === null)
    .map((item) => toCatalogItem({ item, types: byId, setupNames, groups }));
}

/**
 * What step 4 and the line dialog need (ADR 0081): items, line and order types with their
 * fields, the need values and the members. Without `item:read` the items are hidden; without
 * member access nobody but the caller can be assigned.
 */
export async function loadIntakeCatalog({
  userId,
}: {
  userId: string | null;
}): Promise<Result<IntakeCatalog>> {
  const [items, lineTyped, orderTyped, needTyped, members] = await Promise.all([
    loadItems(),
    loadTypedFormData({ base: "LINE" }),
    loadTypedFormData({ base: "ORDER" }),
    loadTypedFormData({ base: "REQUIREMENT" }),
    runOperation({ operation: listMembers, input: { limit: LIMIT } }),
  ]);
  if (!lineTyped.ok) return lineTyped;
  if (!orderTyped.ok) return orderTyped;
  const needTypes = needTyped.ok ? active({ rows: needTyped.value.types }) : [];
  const vocabularies = lineTyped.value.vocabularies;
  return {
    ok: true,
    value: {
      ...{ items: items ?? [], itemsHidden: items === null, userId, vocabularies },
      lineTypes: active({ rows: lineTyped.value.types }),
      orderTypes: active({ rows: orderTyped.value.types }),
      links: { ...lineTyped.value.links, ...orderTyped.value.links },
      needTypeId: needTypes[0]?.id ?? null,
      needValues: vocabularies.flatMap((list) =>
        list.values.map(({ id, name }) => ({ id, name: `${list.name}: ${name}` })),
      ),
      members: (members.ok ? members.value.items : []).map(({ userId: id, name }) => ({
        id,
        name,
      })),
    },
  };
}
