import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict } from "../../shared/errors";
import { fieldValuesOfType } from "./field-usage";

type Db = Pick<OperationContext, "db">;

export type LinkedRecord = { id: string; entityTypeId: string };

export type CountLinksInput = { context: Db; records: readonly LinkedRecord[] };

/** Active records whose LINK fields point to one of `records` (ADR 0026: data present → CONFLICT). */
export async function countLinksTo({ context, records }: CountLinksInput): Promise<number> {
  const typeIds = [...new Set(records.map(({ entityTypeId }) => entityTypeId))];
  if (typeIds.length === 0) return 0;
  const fields = await context.db.fieldDefinition.findMany({
    where: { kind: "LINK", linkTypeId: { in: typeIds } },
    select: { entityTypeId: true, key: true },
  });
  const ids = new Set(records.map(({ id }) => id));
  let count = 0;
  for (const { entityTypeId, key } of fields) {
    const values = await fieldValuesOfType({ context, entityTypeId });
    count += values.filter((value) => ids.has(value[key] as string)).length;
  }
  return count;
}

export type CheckNotLinkedInput = CountLinksInput & { what: string };

/** CONFLICT while an active record links to one of `records`; clear or change those links first. */
export async function checkNotLinked({
  context,
  records,
  what,
}: CheckNotLinkedInput): Promise<Result<true>> {
  const links = await countLinksTo({ context, records });
  return links > 0
    ? conflict({ message: `${what} is linked from ${links} records; change those links first` })
    : ok({ value: true });
}
