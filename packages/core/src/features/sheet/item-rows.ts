import type { OperationContext } from "../../operations/types";
import { asFieldValues } from "../field-definition/field-usage";
import type { SheetDefinitionDto } from "../sheet-definition/schema";
import type { SheetRow } from "./schema";

export type ItemRowsInput = {
  context: Pick<OperationContext, "db">;
  ticketId: string;
  definition: Pick<SheetDefinitionDto, "entityTypeIds" | "fieldIds">;
};

/**
 * One row per line of the ticket that uses an item of an included type and is in a state
 * with `inSheets` (ADR 0044), with the included fields of that item's type, earliest first.
 */
export async function itemRows({
  context,
  ticketId,
  definition,
}: ItemRowsInput): Promise<SheetRow[]> {
  const [fields, lines] = await Promise.all([
    context.db.fieldDefinition.findMany({
      where: { id: { in: definition.fieldIds } },
      select: { entityTypeId: true, key: true },
      orderBy: [{ position: "asc" }, { id: "asc" }],
    }),
    context.db.line.findMany({
      where: {
        ticketId,
        item: { entityTypeId: { in: definition.entityTypeIds } },
        // Only lines whose state the organization marked as sendable (ADR 0044).
        state: { inSheets: true },
      },
      include: { item: true },
      orderBy: [{ startsAt: "asc" }, { id: "asc" }],
    }),
  ]);
  return lines.map(({ item, ...row }) => {
    const own = asFieldValues({ value: item?.fields });
    const keys = fields.filter((field) => field.entityTypeId === item?.entityTypeId);
    return {
      kind: "ITEM",
      key: row.id,
      parentKey: null,
      label: row.name,
      itemName: item?.name ?? null,
      quantity: row.quantity,
      startsAt: row.startsAt.toISOString(),
      endsAt: row.endsAt.toISOString(),
      values: Object.fromEntries(keys.map(({ key }) => [key, own[key] ?? null])),
    };
  });
}
