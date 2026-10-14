import type { Item } from "@okazi/db";
import type { OperationContext } from "../../operations/types";
import { asFieldValues } from "../field-definition/field-usage";
import type { ItemDto } from "./schema";

type Db = Pick<OperationContext, "db">;

export type ToItemDtosInput = { context: Db; rows: readonly Item[] };

/** Items with their setup capacities (largest first). One query for all rows. */
export async function toItemDtos({ context, rows }: ToItemDtosInput): Promise<ItemDto[]> {
  const setups = await context.db.itemSetup.findMany({
    where: { itemId: { in: rows.map((row) => row.id) } },
    orderBy: [{ capacity: "desc" }, { setupId: "asc" }],
    select: { itemId: true, setupId: true, capacity: true },
  });
  return rows.map((row) => ({
    ...row,
    fields: asFieldValues({ value: row.fields }),
    setups: setups
      .filter((setup) => setup.itemId === row.id)
      .map(({ setupId, capacity }) => ({ setupId, capacity })),
  }));
}

export type LoadItemInput = { context: Db; id: string };

export async function loadItem({ context, id }: LoadItemInput): Promise<ItemDto | null> {
  const row = await context.db.item.findFirst({ where: { id } });
  if (!row) return null;
  const [dto] = await toItemDtos({ context, rows: [row] });
  return dto ?? null;
}
