import type { Item, ItemChoiceGroup, ItemComponent } from "@okazi/db";
import type { OperationContext } from "../../operations/types";
import { asFieldValues } from "../field-definition/field-usage";
import type { ItemDto } from "./schema";

type Db = Pick<OperationContext, "db">;

type ChoiceGroupsOfInput = {
  groups: readonly ItemChoiceGroup[];
  components: readonly ItemComponent[];
};

/** An item's choice groups in order, each with its options in the order of the parts. */
const choiceGroupsOf = ({ groups, components }: ChoiceGroupsOfInput) =>
  groups.map(({ id, name, minPick, maxPick }) => ({
    name,
    minPick,
    maxPick,
    itemIds: components
      .filter((component) => component.choiceGroupId === id)
      .map((component) => component.partId),
  }));

export type ToItemDtosInput = { context: Db; rows: readonly Item[] };

/** Items with setup capacities (largest first), parts (by offset) and choice groups. */
export async function toItemDtos({ context, rows }: ToItemDtosInput): Promise<ItemDto[]> {
  const ids = rows.map((row) => row.id);
  const setups = await context.db.itemSetup.findMany({
    where: { itemId: { in: ids } },
    orderBy: [{ capacity: "desc" }, { setupId: "asc" }],
    select: { itemId: true, setupId: true, capacity: true },
  });
  const components = await context.db.itemComponent.findMany({
    where: { parentId: { in: ids } },
    orderBy: [{ offsetMinutes: "asc" }, { position: "asc" }],
  });
  const groups = await context.db.itemChoiceGroup.findMany({
    where: { itemId: { in: ids } },
    orderBy: [{ position: "asc" }],
  });
  return rows.map((row) => ({
    ...row,
    fields: asFieldValues({ value: row.fields }),
    setups: setups
      .filter((setup) => setup.itemId === row.id)
      .map(({ setupId, capacity }) => ({ setupId, capacity })),
    components: components
      .filter((component) => component.parentId === row.id)
      .map(({ partId, quantity, offsetMinutes, durationMinutes, required }) => ({
        itemId: partId,
        quantity,
        offsetMinutes,
        durationMinutes,
        required,
      })),
    choiceGroups: choiceGroupsOf({
      groups: groups.filter((group) => group.itemId === row.id),
      components: components.filter((component) => component.parentId === row.id),
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
